const ConvertUnits = (metric, targetUnit) => {
    const conversionFactors = {
        MiB: {
            GiB: 1 / 1024,
            GB: 1 / 1024 * 1.07374, // Approximation for GB (decimal)
            gbit: 1 / 128, // MiB to gigabits (8 bits per byte)
        },
        GiB: {
            MiB: 1024,
            GB: 1.07374, // Approximation for GB (decimal)
            gbit: 8, // GiB to gigabits
        },
        GB: {
            MiB: 1024 / 1.07374,
            GiB: 1 / 1.07374,
            gbit: 8, // GB to gigabits
        },
        gbit: {
            MiB: 128,
            GiB: 1 / 8,
            GB: 1 / 8,
        },
    };

    // Check if the conversion is possible
    if (!conversionFactors[metric.units] || !conversionFactors[metric.units][targetUnit]) {
        throw new Error(`Conversion from ${metric.units} to ${targetUnit} is not supported.`);
    }

    // Perform the conversion
    const factor = conversionFactors[metric.units][targetUnit];
    return {
        value: metric.value * factor,
        units: targetUnit,
    };
}