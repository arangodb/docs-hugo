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
	issues  *log.Logger
}

var Logger *ArangoproxyLogger

func init() {
	logFile, _ := os.OpenFile("/home/summary.md", os.O_CREATE|os.O_APPEND|os.O_RDWR, 0666)
	summaryWriter := io.Writer(logFile)

	Logger = new(ArangoproxyLogger)
	Logger.logger = log.New(os.Stdout, "", 0)
	Logger.summary = log.New(summaryWriter, "", 0)

	issuesFile, _ := os.OpenFile("/home/report-issues.tsv", os.O_CREATE|os.O_APPEND|os.O_RDWR, 0666)
	Logger.issues = log.New(io.Writer(issuesFile), "", 0)
}

func (l *ArangoproxyLogger) Printf(s string, args ...any) {
	l.logger.Printf(s, args...)
}

func (l *ArangoproxyLogger) Debug(s string, args ...any) {
	if Conf.Debug {
		l.logger.Printf("[DEBUG] "+s+"\n", args...)
	}
}

// Summary adds a line to the details of the build report (Markdown)
func (l *ArangoproxyLogger) Summary(s string, args ...any) {
	l.summary.Printf(s, args...)
}

// Issue records an error or warning for the build report (see
// toolchain/scripts/report-lib.sh for the format)
func (l *ArangoproxyLogger) Issue(kind, section, version, title, location, message string) {
	escape := strings.NewReplacer("\\", "\\\\", "\t", "\\t", "\n", "\\n")
	fields := []string{kind, section, version, title, location, message}
	for i := range fields {
		fields[i] = escape.Replace(fields[i])
	}
	l.issues.Print(strings.Join(fields, "\t"))
}

// Error records an error for the build report
func (l *ArangoproxyLogger) Error(section, version, title, location, message string) {
	l.Issue("error", section, version, title, location, message)
}
