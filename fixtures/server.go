package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

const defaultTimeout = 5 * time.Second

type Project struct {
	ID     int64   `json:"id"`
	Name   string  `json:"name"`
	Budget float64 `json:"budget"`
}

func listProjects(w http.ResponseWriter, r *http.Request) {
	projects := []Project{{ID: 1, Name: "Atelier", Budget: 24000}}
	if err := json.NewEncoder(w).Encode(projects); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /projects", listProjects)
	srv := &http.Server{Addr: ":8080", Handler: mux, ReadTimeout: defaultTimeout}
	log.Fatal(srv.ListenAndServe())
}
