---
title: Start the import
menuTitle: Start import
weight: 15
description: >-
  Once the data files are provided and the graph is designed, you can start the import
---

Before starting the actual import, make sure that:
- You have selected a database for import or created a new one;
- You have provided a valid name for your graph;
- You have created at least one node;
- You have created at least one edge;
- You have uploaded at least one file;
- Every file is related to at least one node or edge;
- Every node and edge is linked to a file;
- Every node and edge has a unique label;
- Every node has a primary identifier selected;
- Every edge has an origin and destination file header selected.

To continue with the import, click the **Save and start import** button. The data
importer provides an overview showing results with the collections that have been
created with the data provided in the files.

To access your newly created graph in the ArangoDB web interface, click the
**See your new graph** button.

## File validation

Once the import has started, the files that you have provided are being validated.
If the validation process detects parsing errors in any of the files, the import
is temporarily paused and the validation errors are shown. You can get a full
report by clicking the **See full report** button.

At this point, you can:
- Continue with the import without addressing the errors. The CSV files will still
  be included in the migration. However, the invalid rows are skipped and
  excluded from the migration.
- Revisit the problematic file(s), resolve the issues, and then re-upload the
  file(s) again.

{{< tip >}}
To ensure the integrity of your data, it is recommended to address all the errors
detected during the validation process.  
{{< /tip >}}

### Validation errors and their meanings

#### Invalid Quotation Mark

This error indicates issues with quotation marks in the CSV data.
It can occur due to improper use of quotes.

#### Missing Quotation Marks

This error occurs when quotation marks are missing or improperly placed in the
CSV data, potentially affecting data enclosure.

#### Insufficient Data Fields

This error occurs when a CSV row has fewer fields than expected. It may indicate
missing or improperly formatted data.

#### Excessive Data Fields

This error occurs when a CSV row has more fields than expected, possibly due to
extra data or formatting issues.

#### Unidentifiable Field Separator

This error suggests that the parser could not identify the field separator
character in the CSV data.