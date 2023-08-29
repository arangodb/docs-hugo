package models

import (
	"io"
	"log"
	"os"
	"strings"
)

type ArangoproxyLogger struct {
	logger  *log.Logger
	summary *log.Logger
}

var Logger *ArangoproxyLogger

func init() {
	logFile, _ := os.OpenFile("/home/summary.md", os.O_CREATE|os.O_APPEND|os.O_RDWR, 0666)
	summaryWriter := io.Writer(logFile)

	Logger = new(ArangoproxyLogger)
	Logger.logger = log.New(os.Stdout, "", log.Ldate|log.Ltime)
	Logger.summary = log.New(summaryWriter, "", 0)
}

func (l *ArangoproxyLogger) Printf(s string, args ...any) {
	l.logger.Printf(s, args...)
}

func (l *ArangoproxyLogger) Summary(s string, args ...any) {
	s = strings.ReplaceAll(s, "\n", "\n<br>")
	l.summary.Printf(s, args...)
}
