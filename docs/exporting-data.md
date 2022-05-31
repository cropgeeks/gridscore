---
title: GridScore Exporting Data
---

# Exporting Data

At any point in time data can be exported from GridScore into simple and reusable formats. The export screen shows multiple tabs each of which exports the data in a slightly different format.

## Data/Dates
<img src="img/screenshot-export-data.png" style="max-width: 100%;" alt="Data export in matrix form">

The first tab exports the data into a data matrix with the plant/plot identifiers in the first column and the trait names as the following column headers. Finally, there are columns for latitude, longitude, elevation and comments. The data and recording dates are then shown in the matrix part of the output.

You can copy/paste this data straight from the text boxes into other tools like Excel or download the data file in a tab-delimited text format.

## Traits
The second tab exports the trait definitions including their name, type and restrictions.

## Field plan
<img src="img/screenshot-export-fieldplan.png" style="max-width: 100%;" alt="Data export in field plan form">

Sometimes it may be useful to export the data in the exact same format as the field plan. For those cases, the field plan tab lets you choose a trait for which to export the data. 

You can copy/paste this data straight from the text boxes into other tools like Excel or download the data file in a tab-delimited text format.


## Germinate

<img src="img/screenshot-export-germinate.png" style="max-width: 100%;" alt="Data export to Germinate">

[Germinate](https://ics.hutton.ac.uk/get-germinate) is a well-known plant genetic resources database which stores various types of data including phenotypic data. Germinate also has a well-defined set of [data templates](https://github.com/germinateplatform/germinate-data-templates) which are used to import data into Germinate. GridScore can export your data straight into the phenotypic data template of Germinate so you don't have to reformat your data manually.

To do so, select the Germinate tab on the export page and then press the `Export to Germinate format` button to start the export process. This may take a few seconds depending on the size of your trial and your internet connection.

Once exported, your data will be downloaded as a Germinate template Excel file.