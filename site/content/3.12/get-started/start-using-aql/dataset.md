---
title: Game of Thrones example dataset
menuTitle: Dataset
weight: 3
---
## Characters

The dataset features 43 characters with their name, surname, age, alive status
and trait references. The surname and age properties are not always present.
The column *traits (resolved)* is not part of the actual data used in this
tutorial, but included for your convenience.

| name       | surname    | alive | age | traits        |
|------------|------------|-------|-----|---------------|
| Ned        | Stark      | true  | 41  | A, H, C, N, P |
| Robert     | Baratheon  | false |     | A, H, C       |
| Jaime      | Lannister  | true  | 36  | A, F, B       |
| Catelyn    | Stark      | false | 40  | D, H, C       |
| Cersei     | Lannister  | true  | 36  | H, E, F       |
| Daenerys   | Targaryen  | true  | 16  | D, H, C       |
| Jorah      | Mormont    | false |     | A, B, C, F    |
| Petyr      | Baelish    | false |     | E, G, F       |
| Viserys    | Targaryen  | false |     | O, L, N       |
| Jon        | Snow       | true  | 16  | A, B, C, F    |
| Sansa      | Stark      | true  | 13  | D, I, J       |
| Arya       | Stark      | true  | 11  | C, K, L       |
| Robb       | Stark      | false |     | A, B, C, K    |
| Theon      | Greyjoy    | true  | 16  | E, R, K       |
| Bran       | Stark      | true  | 10  | L, J          |
| Joffrey    | Baratheon  | false | 19  | I, L, O       |
| Sandor     | Clegane    | true  |     | A, P, K, F    |
| Tyrion     | Lannister  | true  | 32  | F, K, M, N    |
| Khal       | Drogo      | false |     | A, C, O, P    |
| Tywin      | Lannister  | false |     | O, M, H, F    |
| Davos      | Seaworth   | true  | 49  | C, K, P, F    |
| Samwell    | Tarly      | true  | 17  | C, L, I       |
| Stannis    | Baratheon  | false |     | H, O, P, M    |
| Melisandre |            | true  |     | G, E, H       |
| Margaery   | Tyrell     | false |     | M, D, B       |
| Jeor       | Mormont    | false |     | C, H, M, P    |
| Bronn      |            | true  |     | K, E, C       |
| Varys      |            | true  |     | M, F, N, E    |
| Shae       |            | false |     | M, D, G       |
| Talisa     | Maegyr     | false |     | D, C, B       |
| Gendry     |            | false |     | K, C, A       |
| Ygritte    |            | false |     | A, P, K       |
| Tormund    | Giantsbane | true  |     | C, P, A, I    |
| Gilly      |            | true  |     | L, J          |
| Brienne    | Tarth      | true  | 32  | P, C, A, K    |
| Ramsay     | Bolton     | true  |     | E, O, G, A    |
| Ellaria    | Sand       | true  |     | P, O, A, E    |
| Daario     | Naharis    | true  |     | K, P, A       |
| Missandei  |            | true  |     | D, L, C, M    |
| Tommen     | Baratheon  | true  |     | I, L, B       |
| Jaqen      | H'ghar     | true  |     | H, F, K       |
| Roose      | Bolton     | true  |     | H, E, F, A    |
| The High Sparrow |      | true  |     | H, M, F, O    |

## Traits

There are 18 unique traits. Each trait has a random letter as document key.
The trait labels come in English and German.

| _key | en          | de            |
|------|-------------|---------------|
| A    | strong      | stark         |
| B    | polite      | freundlich    |
| C    | loyal       | loyal         |
| D    | beautiful   | schön         |
| E    | sneaky      | hinterlistig  |
| F    | experienced | erfahren      |
| G    | corrupt     | korrupt       |
| H    | powerful    | einflussreich |
| I    | naive       | naiv          |
| J    | unmarried   | unverheiratet |
| K    | skillful    | geschickt     |
| L    | young       | jung          |
| M    | smart       | klug          |
| N    | rational    | rational      |
| O    | ruthless    | skrupellos    |
| P    | brave       | mutig         |
| Q    | mighty      | mächtig       |
| R    | weak        | schwach       |

## Locations

This small collection of 8 filming locations comes with two attributes, a
`name` and a `coordinate`. The coordinates are modeled as number arrays,
comprised of a latitude and a longitude value each.

| name            | coordinates           |
|-----------------|-----------------------|
| Dragonstone     | 55.167801,  -6.815096 |
| King's Landing  | 42.639752,  18.110189 |
| The Red Keep    | 35.896447,  14.446442 |
| Yunkai          | 31.046642,  -7.129532 |
| Astapor         | 31.509740,  -9.774249 |
| Winterfell      | 54.368321,  -5.581312 |
| Vaes Dothrak    | 54.167760,  -6.096125 |
| Beyond the wall | 64.265473, -21.094093 |

{{< comment >}}TODO: Should be coordinate_s_, need to update dataset!{{< /comment >}}
