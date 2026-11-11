package models

import (
	"strings"
	"sync"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
)

// OVERRIDE: only the output of the examples that match one of the regular
// expressions is saved, regardless of whether the example code changed
type overridePattern struct {
	pattern string
	re      *regexp2.Regexp
	matched bool
}

var (
	overrides   []*overridePattern
	overridesMu sync.Mutex
)

// SetOverride parses the comma-separated regular expressions of the -override flag
func SetOverride(list string) {
	for _, pattern := range strings.Split(list, ",") {
		pattern = strings.TrimSpace(pattern)
		if pattern == "" {
			continue
		}
		re, err := regexp2.Compile(pattern, 0)
		if err != nil {
			Logger.Printf("[OVERRIDE] [ERROR] Invalid regular expression %s: %s", pattern, err.Error())
			Logger.Error("Examples", "", "Override", "", "Invalid regular expression `"+pattern+"`: "+err.Error())
			continue
		}
		overrides = append(overrides, &overridePattern{pattern: pattern, re: re})
	}
}

// OverrideActive reports whether OVERRIDE is set (even if all regexes are invalid,
// so that no other output is saved)
func OverrideActive() bool {
	return Conf.Override != ""
}

// MatchesOverride reports whether the example name (e.g. HttpGharialCreate) or
// the cache entry name (e.g. HttpGharialCreate_single) matches
func MatchesOverride(name, entryName string) bool {
	overridesMu.Lock()
	defer overridesMu.Unlock()
	matches := false
	for _, o := range overrides {
		if utils.Regexp2StringHasMatch(o.re, name) || utils.Regexp2StringHasMatch(o.re, entryName) {
			o.matched = true
			matches = true
		}
	}
	return matches
}

// UnmatchedOverrides returns the regular expressions that matched no example so far
func UnmatchedOverrides() []string {
	overridesMu.Lock()
	defer overridesMu.Unlock()
	var unmatched []string
	for _, o := range overrides {
		if !o.matched {
			unmatched = append(unmatched, o.pattern)
		}
	}
	return unmatched
}
