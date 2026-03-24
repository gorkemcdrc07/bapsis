export function buildWhByName(warehouses = []) {
    const map = {};
    (warehouses || []).forEach((w) => {
        if (w?.wh_name) {
            map[w.wh_name] = { ...w };
        }
    });
    return map;
}

export function getTruckCapacity(trucks = []) {
    const capacities = (trucks || [])
        .map((t) => Number(t.capacity || 0))
        .filter((v) => !Number.isNaN(v) && v > 0);

    if (!capacities.length) return 33;
    return Math.max(...capacities);
}

export function getDepotName(warehouses = []) {
    const depot = (warehouses || []).find((w) => Number(w.is_origin || 0) === 1);

    if (!depot?.wh_name) {
        throw new Error("Warehouses sheet içinde is_origin=1 olan depo bulunamadı.");
    }

    return depot.wh_name;
}

export function normalizeDateKey(value) {
    if (!value) return null;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    if (typeof value === "number") {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const d = new Date(excelEpoch.getTime() + value * 86400000);
        if (!Number.isNaN(d.getTime())) {
            return d.toISOString().slice(0, 10);
        }
    }

    const str = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.slice(0, 10);
    }

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
        const [dd, mm, yyyy] = str.split(".");
        return `${yyyy}-${mm}-${dd}`;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const [dd, mm, yyyy] = str.split("/");
        return `${yyyy}-${mm}-${dd}`;
    }

    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
    }

    return null;
}

export function getAvailableDates(demands = []) {
    const uniq = new Set();

    (demands || []).forEach((row) => {
        const key = normalizeDateKey(row?.date);
        if (key) uniq.add(key);
    });

    return Array.from(uniq).sort();
}

export function filterDemandsByDate(demands = [], dateStr) {
    return (demands || []).filter((row) => normalizeDateKey(row?.date) === dateStr);
}

export function splitLargeDemands(rows = [], truckCapacity = 33) {
    const result = [];

    (rows || []).forEach((row) => {
        const whName = row?.wh_name;
        let demand = Number(row?.demand_units || 0);

        if (!whName || Number.isNaN(demand) || demand <= 0) {
            return;
        }

        while (demand > truckCapacity) {
            result.push({
                wh_name: whName,
                demand_units: truckCapacity,
                group: row?.group,
            });
            demand -= truckCapacity;
        }

        if (demand > 0) {
            result.push({
                wh_name: whName,
                demand_units: demand,
                group: row?.group,
            });
        }
    });

    return result;
}

export function prepareDemandsForPlanning(demands = [], groups = [], truckCapacity = 33) {
    const splitRows = splitLargeDemands(demands, truckCapacity);

    const groupMap = {};
    (groups || []).forEach((g) => {
        if (g?.wh_name) {
            groupMap[g.wh_name] = g.group;
        }
    });

    return splitRows.map((row) => ({
        ...row,
        group: row.group || groupMap[row.wh_name] || row.wh_name,
    }));
}

function groupRowsByGroup(rows = []) {
    const grouped = {};

    (rows || []).forEach((row) => {
        const gid = row?.group || row?.wh_name;
        if (!gid) return;

        if (!grouped[gid]) grouped[gid] = [];
        grouped[gid].push({ ...row });
    });

    return grouped;
}

export function allocateGreedyExact(demands = [], truckCapacity = 33, groups = []) {
    const prepared = prepareDemandsForPlanning(demands, groups, truckCapacity);
    const grouped = groupRowsByGroup(prepared);

    const plan = {};
    const truckLoads = {};
    let truckNo = 1;

    Object.keys(grouped).forEach((gid) => {
        const rows = grouped[gid]
            .map((r) => ({
                ...r,
                demand_units: Number(r.demand_units || 0),
            }))
            .filter((r) => !Number.isNaN(r.demand_units) && r.demand_units > 0)
            .sort((a, b) => b.demand_units - a.demand_units);

        const totalPallets = rows.reduce((sum, r) => sum + r.demand_units, 0);

        if (totalPallets <= truckCapacity) {
            const truckName = `Truck${truckNo}`;
            plan[truckName] = rows.map((r) => r.wh_name);
            truckLoads[truckName] = totalPallets;
            truckNo += 1;
            return;
        }

        let remaining = [...rows];

        while (remaining.length > 0) {
            let load = 0;
            const stops = [];
            const pickedIndexes = [];

            for (let i = 0; i < remaining.length; i += 1) {
                const row = remaining[i];
                const dem = Number(row.demand_units || 0);

                if (load + dem <= truckCapacity) {
                    load += dem;
                    stops.push(row.wh_name);
                    pickedIndexes.push(i);
                }

                if (load === truckCapacity) break;
            }

            if (pickedIndexes.length === 0) {
                throw new Error(`Greedy could not allocate remaining rows for group '${gid}'.`);
            }

            const truckName = `Truck${truckNo}`;
            plan[truckName] = stops;
            truckLoads[truckName] = load;
            truckNo += 1;

            remaining = remaining.filter((_, idx) => !pickedIndexes.includes(idx));
        }
    });

    return { plan, truckLoads };
}

function getCrossDistance(cross = {}, from, to) {
    if (!cross || !from || !to) return null;

    if (cross[from] && cross[from][to] !== undefined) {
        return Number(cross[from][to]);
    }

    const flatKey = `${from}__${to}`;
    if (cross[flatKey] !== undefined) {
        return Number(cross[flatKey]);
    }

    return null;
}

function getTariffByLastStop(tariffs = [], lastStop) {
    return (tariffs || []).find((t) => String(t?.last_stop || "").trim() === String(lastStop || "").trim());
}

export function calculateCostComponents(
    stops = [],
    tariffs = [],
    whByName = {},
    cross = {},
    depotName = ""
) {
    if (!stops.length) {
        return {
            base_cost: 0,
            add_stop_cost: 0,
            extra_km_price: 0,
            baseline_km: 0,
            route_km: 0,
            extra_km_over_baseline: 0,
            extra_km_chargeable: 0,
            extra_km_cost: 0,
            total_cost: 0,
            missing_tariff: false,
        };
    }

    const lastStop = stops[stops.length - 1];
    const tariff = getTariffByLastStop(tariffs, lastStop);

    if (!tariff) {
        return {
            base_cost: 1000,
            add_stop_cost: 0,
            extra_km_price: 0,
            baseline_km: 0,
            route_km: 0,
            extra_km_over_baseline: 0,
            extra_km_chargeable: 0,
            extra_km_cost: 0,
            total_cost: 1000,
            missing_tariff: true,
        };
    }

    const baseCost = Number(tariff.base_price || 0);
    const extraSame = Number(tariff.extra_stop_same_city || 0);
    const extraDiff = Number(tariff.extra_stop_diff_city || 0);
    const extraKmPrice = Number(tariff.extra_km_price || 0);

    let addStopCost = 0;

    for (let i = 0; i < stops.length - 1; i += 1) {
        const stop = stops[i];
        const sameCity =
            whByName[stop]?.city &&
            whByName[lastStop]?.city &&
            whByName[stop].city === whByName[lastStop].city;

        addStopCost += sameCity ? extraSame : extraDiff;
    }

    let baselineKm = 0;
    let routeKm = 0;
    let extraKmOverBaseline = 0;
    let extraKmChargeable = 0;
    let extraKmCost = 0;

    if (stops.length >= 2 && extraKmPrice > 0 && depotName) {
        const baseline = getCrossDistance(cross, depotName, lastStop);

        let totalRoute = 0;
        let prev = depotName;
        let ok = true;

        for (const stop of stops) {
            const dist = getCrossDistance(cross, prev, stop);

            if (dist === null || Number.isNaN(dist)) {
                ok = false;
                break;
            }

            totalRoute += dist;
            prev = stop;
        }

        if (ok && baseline !== null && !Number.isNaN(baseline)) {
            baselineKm = Number(baseline);
            routeKm = Number(totalRoute);
            extraKmOverBaseline = routeKm - baselineKm;
            extraKmChargeable = Math.max(extraKmOverBaseline - 50, 0);
            extraKmCost = extraKmChargeable > 0 ? extraKmChargeable * extraKmPrice : 0;
        }
    }

    const totalCost = baseCost + addStopCost + extraKmCost;

    return {
        base_cost: baseCost,
        add_stop_cost: addStopCost,
        extra_km_price: extraKmPrice,
        baseline_km: baselineKm,
        route_km: routeKm,
        extra_km_over_baseline: extraKmOverBaseline,
        extra_km_chargeable: extraKmChargeable,
        extra_km_cost: extraKmCost,
        total_cost: totalCost,
        missing_tariff: false,
    };
}

export function buildSummary(
    plan = {},
    truckLoads = {},
    tariffs = [],
    whByName = {},
    cross = {},
    truckCapacity = 33,
    depotName = ""
) {
    return Object.entries(plan).map(([truck, stops]) => {
        const pallets = Number(truckLoads[truck] || 0);
        const comp = calculateCostComponents(stops, tariffs, whByName, cross, depotName);

        return {
            truck,
            stops: stops.length,
            total_pallets: pallets,
            utilization_pct: Number(((100 * pallets) / truckCapacity).toFixed(1)),
            base_cost: Number(comp.base_cost.toFixed(2)),
            add_stop_cost: Number(comp.add_stop_cost.toFixed(2)),
            extra_km_price: Number(comp.extra_km_price.toFixed(4)),
            baseline_km: Number(comp.baseline_km.toFixed(2)),
            route_km: Number(comp.route_km.toFixed(2)),
            extra_km_over_baseline: Number(comp.extra_km_over_baseline.toFixed(2)),
            extra_km_chargeable: Number(comp.extra_km_chargeable.toFixed(2)),
            extra_km_cost: Number(comp.extra_km_cost.toFixed(2)),
            total_cost: Number(comp.total_cost.toFixed(2)),
            route: stops.join(" → "),
            missing_tariff: comp.missing_tariff,
        };
    });
}

export function getMissingTariffs(summary = []) {
    return summary
        .filter((row) => row.missing_tariff)
        .map((row) => {
            const parts = String(row.route || "").split(" → ");
            return parts[parts.length - 1];
        })
        .filter(Boolean);
}