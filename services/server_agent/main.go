package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"server_agent/stats"
)

func main() {
	// Start a ticker that checks the drive status every 10 minutes
	checkTicker := time.NewTicker(10 * time.Minute)
	// Start a ticker that sends all stats every hour
	sendTicker := time.NewTicker(1 * time.Hour)

	// Check the drives initially at startup
	go checkDrives()
	go collectAndSendStats()

	for {
		select {
		case <-checkTicker.C:
			go checkDrives()
		case <-sendTicker.C:
			go collectAndSendStats()
		}
	}
}

// checkDrives checks the status of all drives and logs any failures.
func checkDrives() {
	/*
		drives, err := stats.GetDriveStats()
		if err != nil {
			log.Println("Error getting drive stats:", err)
			return
		}
			for _, drive := range drives {

					if drive.IsFailing() {
						// Immediate action can be taken if necessary, like logging or sending alerts
						log.Println("Drive failure detected:", drive.Name)
						// Optional: send an alert or trigger an immediate data send
					}

			}
	*/
}

func collectAndSendStats() {
	// Collect all the stats
	drives, err := stats.GetDriveStats()
	if err != nil {
		log.Println("Error getting drive stats:", err)
		return
	}

	cpuStats, err := stats.GetCPUStats() // Placeholder for actual CPU stats collection
	if err != nil {
		log.Println("Error getting CPU stats:", err)
		return
	}

	memStats, err := stats.GetMemStats() // Placeholder for actual memory stats collection
	if err != nil {
		log.Println("Error getting memory stats:", err)
		return
	}

	networkStats, err := stats.GetNetworkStats() // Placeholder for actual network stats collection
	if err != nil {
		log.Println("Error getting network stats:", err)
		return
	}

	// Prepare data to send
	dataToSend := map[string]interface{}{
		"drives":  drives,
		"cpu":     cpuStats,
		"memory":  memStats,
		"network": networkStats,
	}

	// Convert the data to a pretty-printed JSON format
	jsonData, err := json.MarshalIndent(dataToSend, "", "  ")
	if err != nil {
		log.Println("Error marshalling data to JSON:", err)
		return
	}

	// Log the JSON formatted data for debugging
	log.Println("Collected Stats (formatted as JSON):")
	log.Println(string(jsonData))

	// Commented out sending data for debug purposes
	// err = sendData(dataToSend)
	// if err != nil {
	// 	log.Println("Error sending data to server:", err)
	// }
}

// sendData sends the prepared data to the web service.
func sendData(data map[string]interface{}) error {
	if data == nil {
		return nil
	}

	url := "http://your-web-service-url.com/api/stats"
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("failed to send data, status code: " + resp.Status)
	}

	return nil
}
