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
	checkTicker := time.NewTicker(10 * time.Minute)
	sendTicker := time.NewTicker(1 * time.Hour)

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
	drives, err := stats.GetDriveStats()
	if err != nil {
		log.Println("Error getting drive stats:", err)
		return
	}

	cpuStats, err := stats.GetCPUStats()
	if err != nil {
		log.Println("Error getting CPU stats:", err)
		return
	}

	memStats, err := stats.GetMemStats()
	if err != nil {
		log.Println("Error getting memory stats:", err)
		return
	}

	networkStats, err := stats.GetNetworkStats()
	if err != nil {
		log.Println("Error getting network stats:", err)
		return
	}

	dataToSend := map[string]interface{}{
		"drives":  drives,
		"cpu":     cpuStats,
		"memory":  memStats,
		"network": networkStats,
	}

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
