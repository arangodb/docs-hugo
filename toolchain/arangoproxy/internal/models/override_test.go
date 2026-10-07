package models

import (
	"reflect"
	"testing"
)

func TestOverride(t *testing.T) {
	Conf.Override = "HttpGharialCreateSmart_single,^HttpGharialCreate$,Typo"
	SetOverride(Conf.Override)
	defer func() { overrides = nil; Conf.Override = "" }()

	tests := []struct {
		name string
		want bool
	}{
		{"HttpGharialCreateSmart", true}, // cache entry name
		{"HttpGharialCreate", true},      // example name
		{"HttpGharialCreateEnterprise", false},
	}
	for _, test := range tests {
		if got := MatchesOverride(test.name, test.name+"_single"); got != test.want {
			t.Errorf("MatchesOverride(%s) = %t, want %t", test.name, got, test.want)
		}
	}
	if got := UnmatchedOverrides(); !reflect.DeepEqual(got, []string{"Typo"}) {
		t.Errorf("UnmatchedOverrides() = %v", got)
	}
}
