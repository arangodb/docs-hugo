---
title: Geospatial queries
menuTitle: Geospatial queries
weight: 30
---
Geospatial coordinates consisting of a latitude and longitude value
can be stored either as two separate attributes, or as a single
attribute in the form of an array with both numeric values.
ArangoDB can index such coordinates for fast geospatial queries.

## Locations data

Insert some filming locations into a new collection called `Locations`,
which you need to create first, and then run below AQL query:

```aql
LET places = [
  { "name": "Dragonstone", "coordinates": [ 55.167801, -6.815096 ] },
  { "name": "King's Landing", "coordinates": [ 42.639752, 18.110189 ] },
  { "name": "The Red Keep", "coordinates": [ 35.896447, 14.446442 ] },
  { "name": "Yunkai", "coordinates": [ 31.046642, -7.129532 ] },
  { "name": "Astapor", "coordinates": [ 31.50974, -9.774249 ] },
  { "name": "Winterfell", "coordinates": [ 54.368321, -5.581312 ] },
  { "name": "Vaes Dothrak", "coordinates": [ 54.16776, -6.096125 ] },
  { "name": "Beyond the wall", "coordinates": [ 64.265473, -21.094093 ] }
]

FOR place IN places
  INSERT place INTO Locations
  RETURN GEO_POINT(NEW.coordinates[1], NEW.coordinates[0])
```

The last line of the query returns the locations as GeoJSON Points to make the
web interface render a map with markers to give you a visualization of where
the filming locations are. Note that the coordinate order is longitude, than
latitude with GeoJSON, whereas the dataset uses latitude, longitude.
 
## Geospatial index

To query based on coordinates, a [geo index](../../index-and-search/indexing/working-with-indexes/geo-spatial-indexes.md)
is required. It determines which fields contain the latitude and longitude
values.

1. Click **Collections** in the main navigation
2. Click the name or row of the **Locations** collection
3. Switch to the **Indexes** tab at top
4. Click the **Add Index** button
5. Change the **Type** to **Geo Index**
6. Enter `coordinates` into **Fields**
7. Click the **Create** button to confirm

## Find nearby locations

A `FOR` loop is used again, with a subsequent `SORT` operation based on the
`DISTANCE()` between a stored coordinate pair and a coordinate pair given in a query.
This pattern is recognized by the query optimizer. A geo index will be used to
accelerate such queries if one is available.

The default sorting direction is ascending, so a query finds the coordinates
closest to the reference point first (lowest distance). `LIMIT` can be used
to restrict the number of results to at most *n* matches.

In below example, the limit is set to 3. The origin (the reference point) is
a coordinate pair somewhere downtown in Dublin, Ireland:

```aql
FOR loc IN Locations
  LET distance = DISTANCE(loc.coordinates[0], loc.coordinates[1], 53.35, -6.25)
  SORT distance
  LIMIT 3
  RETURN {
    name: loc.name,
    latitude: loc.coordinates[0],
    longitude: loc.coordinates[1],
    distance
  }
```

```json
[
  {
    "name": "Vaes Dothrak",
    "latitude": 54.16776,
    "longitude": -6.096125,
    "distance": 91491.58596795711
  },
  {
    "name": "Winterfell",
    "latitude": 54.368321,
    "longitude": -5.581312,
    "distance": 121425.66829502625
  },
  {
    "name": "Dragonstone",
    "latitude": 55.167801,
    "longitude": -6.815096,
    "distance": 205433.7784182078
  }
]
```

The query returns the location name, as well as the coordinates and the
calculated distance in meters. The coordinates are returned as two separate
attributes. You may return just the document with a simple `RETURN loc` instead
if you want. Or return the whole document with an added distance attribute using
`RETURN MERGE(loc, { distance })`.

## Find locations within radius

`LIMIT` can be swapped out with a `FILTER` that checks the distance, to find
locations within a given radius from a reference point. Remember that the unit
is meters. The example uses a radius of 200,000 meters (200 kilometers):

```aql
FOR loc IN Locations
  LET distance = DISTANCE(loc.coordinates[0], loc.coordinates[1], 53.35, -6.25)
  SORT distance
  FILTER distance < 200 * 1000
  RETURN {
    name: loc.name,
    latitude: loc.coordinates[0],
    longitude: loc.coordinates[1],
    distance: ROUND(distance / 1000)
  }
```

```json
[
  {
    "name": "Vaes Dothrak",
    "latitude": 54.16776,
    "longitude": -6.096125,
    "distance": 91
  },
  {
    "name": "Winterfell",
    "latitude": 54.368321,
    "longitude": -5.581312,
    "distance": 121
  }
]
```

The distances are converted to kilometers and rounded for readability.
