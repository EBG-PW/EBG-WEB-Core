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

const ConvertComputerSpaceUnits = (metric, targetUnit) => {
    // Check if the input unit and target unit are valid
    if (!unitsTable[metric.units]) throw new Error(`Unsupported source unit: ${metric.units}`);

    if (targetUnit === "auto") {
        const valueInBytes = metric.value * unitsTable[metric.units];
        const suitableUnit = Object.entries(unitsTable)
            .sort(([, a], [, b]) => a - b)
            .reverse()
            .find(([unit, factor]) => valueInBytes / factor >= 1)[0];

        targetUnit = suitableUnit;
    }

    if (!unitsTable[targetUnit]) throw new Error(`Unsupported target unit: ${targetUnit}`);

    const valueInBytes = metric.value * unitsTable[metric.units];
    const convertedValue = valueInBytes / unitsTable[targetUnit];

    return {
        value: convertedValue,
        units: targetUnit,
    };
}

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