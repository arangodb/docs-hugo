package models

import "os"

// Functions to run before arangoproxy exits, e.g. writing the pending cache entries
var BeforeExit []func()

// Exit runs the BeforeExit functions, then exits with the given code
func Exit(code int) {
	for _, f := range BeforeExit {
		f()
	}
	os.Exit(code)
}
