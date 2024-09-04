package stats

import (
	"log"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

// CPUStats Struct
type CPUStats struct {
	ModelName string  `json:"model_name"`
	CPUs      int     `json:"cpu_count"`
	Threads   int     `json:"threads"`
	Clock     float64 `json:"clock_mhz"`
	Temp      float64 `json:"temp_c"`
	Usage     float64 `json:"usage_percent"`
}

// MemStats Struct
type MemStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"used_percent"`
}

// NetworkStats Struct
type NetworkStats struct {
	BytesSent uint64 `json:"bytes_sent"`
	BytesRecv uint64 `json:"bytes_recv"`
}

// Returns detailed CPU statistics
func GetCPUStats() (CPUStats, error) {
	var stats CPUStats

	info, err := cpu.Info()
	if err != nil || len(info) == 0 {
		log.Println("Error getting CPU info:", err)
		stats.ModelName = "Unknown"
		stats.CPUs = -1
		stats.Threads = -1
		stats.Clock = -1
	} else {
		stats.ModelName = info[0].ModelName
		stats.CPUs = len(info)
		stats.Threads = int(info[0].Cores)
		stats.Clock = info[0].Mhz
	}

	usage, err := cpu.Percent(1*time.Second, false)
	if err != nil {
		log.Println("Error getting CPU usage:", err)
		stats.Usage = -1
	} else {
		stats.Usage = usage[0]
	}

	// Get CPU temperature (if available) - On Windows it needs Administrator privileges or it returns an error
	temp, err := host.SensorsTemperatures()
	if err != nil || len(temp) == 0 {
		log.Println("Error getting CPU temperature:", err)
		stats.Temp = -1
	} else {
		// Assuming the first temperature sensor is the CPU temp
		stats.Temp = temp[0].Temperature
	}

	return stats, nil
}

// Returns detailed memory statistics
func GetMemStats() (MemStats, error) {
	var stats MemStats

	// Get virtual memory statistics
	vmStat, err := mem.VirtualMemory()
	if err != nil {
		log.Println("Error getting memory stats:", err)
		stats.Total = 0
		stats.Used = 0
		stats.UsedPercent = -1
	} else {
		stats.Total = vmStat.Total
		stats.Used = vmStat.Used
		stats.UsedPercent = vmStat.UsedPercent
	}

	return stats, nil
}

// Returns detailed network I/O stats
func GetNetworkStats() (NetworkStats, error) {
	var stats NetworkStats

	ioStats, err := net.IOCounters(false)
	if err != nil || len(ioStats) == 0 {
		log.Println("Error getting network stats:", err)
		stats.BytesSent = 0
		stats.BytesRecv = 0
	} else {
		for _, stat := range ioStats {
			stats.BytesSent += stat.BytesSent
			stats.BytesRecv += stat.BytesRecv
		}
	}

	return stats, nil
}
