---
title: Game of Thrones example dataset
menuTitle: Dataset
weight: 3
---
## Characters

The dataset features 43 characters with their name, surname, age, alive status
and trait references. Each character also has a document key derived from the
character's name. The surname and age properties are not always present.

| _key         | name       | surname    | alive | age | traits        |
|--------------|------------|------------|-------|-----|---------------|
| ned          | Ned        | Stark      | true  | 41  | A, H, C, N, P |
| robert       | Robert     | Baratheon  | false |     | A, H, C       |
| jaime        | Jaime      | Lannister  | true  | 36  | A, F, B       |
| catelyn      | Catelyn    | Stark      | false | 40  | D, H, C       |
| cersei       | Cersei     | Lannister  | true  | 36  | H, E, F       |
| daenerys     | Daenerys   | Targaryen  | true  | 16  | D, H, C       |
| jorah        | Jorah      | Mormont    | false |     | A, B, C, F    |
| petyr        | Petyr      | Baelish    | false |     | E, G, F       |
| viserys      | Viserys    | Targaryen  | false |     | O, L, N       |
| jon          | Jon        | Snow       | true  | 16  | A, B, C, F    |
| sansa        | Sansa      | Stark      | true  | 13  | D, I, J       |
| arya         | Arya       | Stark      | true  | 11  | C, K, L       |
| robb         | Robb       | Stark      | false |     | A, B, C, K    |
| theon        | Theon      | Greyjoy    | true  | 16  | E, R, K       |
| bran         | Bran       | Stark      | true  | 10  | L, J          |
| joffrey      | Joffrey    | Baratheon  | false | 19  | I, L, O       |
| sandor       | Sandor     | Clegane    | true  |     | A, P, K, F    |
| tyrion       | Tyrion     | Lannister  | true  | 32  | F, K, M, N    |
| khal         | Khal       | Drogo      | false |     | A, C, O, P    |
| tywin        | Tywin      | Lannister  | false |     | O, M, H, F    |
| davos        | Davos      | Seaworth   | true  | 49  | C, K, P, F    |
| samwell      | Samwell    | Tarly      | true  | 17  | C, L, I       |
| stannis      | Stannis    | Baratheon  | false |     | H, O, P, M    |
| melisandre   | Melisandre |            | true  |     | G, E, H       |
| margaery     | Margaery   | Tyrell     | false |     | M, D, B       |
| jeor         | Jeor       | Mormont    | false |     | C, H, M, P    |
| bronn        | Bronn      |            | true  |     | K, E, C       |
| varys        | Varys      |            | true  |     | M, F, N, E    |
| shae         | Shae       |            | false |     | M, D, G       |
| talisa       | Talisa     | Maegyr     | false |     | D, C, B       |
| gendry       | Gendry     |            | false |     | K, C, A       |
| ygritte      | Ygritte    |            | false |     | A, P, K       |
| tormund      | Tormund    | Giantsbane | true  |     | C, P, A, I    |
| gilly        | Gilly      |            | true  |     | L, J          |
| brienne      | Brienne    | Tarth      | true  | 32  | P, C, A, K    |
| ramsay       | Ramsay     | Bolton     | true  |     | E, O, G, A    |
| ellaria      | Ellaria    | Sand       | true  |     | P, O, A, E    |
| daario       | Daario     | Naharis    | true  |     | K, P, A       |
| missandei    | Missandei  |            | true  |     | D, L, C, M    |
| tommen       | Tommen     | Baratheon  | true  |     | I, L, B       |
| jaqen        | Jaqen      | H'ghar     | true  |     | H, F, K       |
| roose        | Roose      | Bolton     | true  |     | H, E, F, A    |
| high-sparrow | The High Sparrow |      | true  |     | H, M, F, O    |

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

This small collection of 8 filming locations comes with two attributes,
`name` and `coordinates`. The coordinate pairs are modeled as number arrays,
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
