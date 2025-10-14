// Convertion lookup table
const unitsTable = {
    Bytes: 1,
    KiB: 1024,
    MiB: 1024 ** 2,
    GiB: 1024 ** 3,
    TiB: 1024 ** 4,
    PiB: 1024 ** 5,
    KB: 1000,
    MB: 1000 ** 2,
    GB: 1000 ** 3,
    TB: 1000 ** 4,
    PB: 1000 ** 5,
};

const operationsUnitsTable = {
    'operations/s': 1,
    'Koperations/s': 1000,
    'Moperations/s': 1000 ** 2,
    'Goperations/s': 1000 ** 3,
    'Toperations/s': 1000 ** 4,
    'Poperations/s': 1000 ** 5,
};

const bandwidthUnitsTable = {
    'bits/s': 1,
    'kilobits/s': 1000,
    'megabits/s': 1000 ** 2,
    'gigabits/s': 1000 ** 3,
    'terabits/s': 1000 ** 4,
    'petabits/s': 1000 ** 5,
    'Bytes/s': 8,
    'KiB/s': 8 * 1024,
    'MiB/s': 8 * 1024 ** 2,
    'GiB/s': 8 * 1024 ** 3,
    'TiB/s': 8 * 1024 ** 4,
    'PiB/s': 8 * 1024 ** 5,
    'KB/s': 8 * 1000,
    'MB/s': 8 * 1000 ** 2,
    'GB/s': 8 * 1000 ** 3,
    'TB/s': 8 * 1000 ** 4,
    'PB/s': 8 * 1000 ** 5,
};

const packetsUnitsTable = {
    'packets/s': 1,
    'Kpackets/s': 1000,
    'Mpackets/s': 1000 ** 2,
    'Gpackets/s': 1000 ** 3,
    'Tpackets/s': 1000 ** 4,
};

const ConvertComputerSpaceUnits = (metric, targetUnit = "auto") => {
    const allUnits = { ...unitsTable, ...bandwidthUnitsTable, ...packetsUnitsTable, ...operationsUnitsTable };

    // Check if the input unit and target unit are valid
    if (!allUnits[metric.units]) throw new Error(`Unsupported source unit: ${metric.units}`);

    if (targetUnit === "auto") {
        const valueInBase = metric.value * allUnits[metric.units];
        const suitableUnit = Object.entries(allUnits)
            .sort(([, a], [, b]) => a - b)
            .reverse()
            .find(([unit, factor]) => valueInBase / factor >= 1)[0];

        targetUnit = suitableUnit;
    }

    if (!allUnits[targetUnit]) throw new Error(`Unsupported target unit: ${targetUnit}`);

    const valueInBase = metric.value * allUnits[metric.units];
    let convertedValue = valueInBase / allUnits[targetUnit];

    if (convertedValue < 0) convertedValue = convertedValue * -1; 

    return {
        value: convertedValue,
        units: targetUnit,
    };
};

const AddValuesWithUnits = (metrics, targetUnit = "auto") => {
    if (!Array.isArray(metrics) || metrics.length === 0) throw new Error("Metrics must be a non-empty array.");

    metrics.forEach((metric) => {
        if (!unitsTable[metric.units]) throw new Error(`Unsupported unit: ${metric.units}`);
    });

    const totalBytes = metrics.reduce((sum, metric) => {
        return sum + metric.value * unitsTable[metric.units];
    }, 0);

    if (targetUnit === "auto") {
        const suitableUnit = Object.entries(unitsTable)
            .sort(([, a], [, b]) => a - b)
            .reverse()
            .find(([unit, factor]) => totalBytes / factor >= 1)[0];

        targetUnit = suitableUnit;
    }

    if (!unitsTable[targetUnit]) throw new Error(`Unsupported target unit: ${targetUnit}`);

    const convertedValue = totalBytes / unitsTable[targetUnit];

    return {
        value: convertedValue,
        units: targetUnit,
    };
}