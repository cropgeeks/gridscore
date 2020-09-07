# GridScore

<p align="center">
  <img src="https://raw.githubusercontent.com/sebastian-raubach/gridscore/master/public/img/gridscore.svg?sanitize=true" width="200" alt="Logo">
</p>

![GitHub](https://img.shields.io/github/license/sebastian-raubach/gridscore)
![GitHub package.json version](https://img.shields.io/github/package-json/v/sebastian-raubach/gridscore)
![GitHub last commit](https://img.shields.io/github/last-commit/sebastian-raubach/gridscore)

GridScore is a field trial phenotyping app for trait data. It lets you keep track of what's happening in the field on a plot-level basis. This could be anything from plant emergence, flowering date, plant height, flower colour, etc. You can define the layout of your field trial and the traits you want to score. GridScore then presents your data in a table format representing your field layout. Data is recorded by clicking on a specific plot in a field and then entering your data.

## Installation
GridScore is a so-called Progressive Web App (PWA), which means that it's basically a website, but on phones and tablets it can be installed to work offline. The mechanism for installing a PWA on your device will vary depending on the operating system. On Android a banner will appear at the bottom of the screen prompting you to install the application. On iOS, press the share icon and then add the app to your home screen.

To check out GridScore visit the website at https://ics.hutton.ac.uk/gridscore/

## Data
All your data is stored in the app and can be exported at any time. This, however, also means that your data is at the mercy of the operating system's data retention policy. Android does not automatically delete the data, unless the user clears the browser's data manually. On iOS, recent changes mean that Apple will delete any website's (and by extension any PWA's) data after 7 days if the app hasn't been used in the meantime. We therefore recommend to regularly export your data and ideally open the app every few days to prevent iOS from deleting your data. To be safe, stick to Android devices for now.

## Functionality

### Setup
![](https://raw.githubusercontent.com/sebastian-raubach/gridscore/master/public/img/screenshot-setup.png "Setup")
The setup screen is used to define some basic characteristics of your field trial. Row and column counts as well as a list of germplasm/variety names is used to identify each plot uniquely. Traits are then defined along with their type which can be one of 'integer', 'floating point', 'date' or 'text'.

Optionally, the corner points of the field can be configured. This can either be done my walking to the corners of the field and clicking the button to get your GPS position or by manually entering the location. Defining the corner points allows GridScore to show your recorded data in the context of the field plots as well as to highlight your location in the data recording table for easier navigation and orientation.


### Grid view
![](https://raw.githubusercontent.com/sebastian-raubach/gridscore/master/public/img/screenshot-grid.jpg "Grid view")
The main data table represents your field plan with rows and columns. Each cell is a plot and shows you a short version of the germplasm/variety name. Clicking on a cell opens the data entry dialog where you can enter the data values for each trait. The coloured dots in each cell represent whether the respective trait has already been scored. This is especially useful when scoring time-based traits like emergence, which allows you to only visit the cells without the corresponding data indicator.

### Timeline
![](https://raw.githubusercontent.com/sebastian-raubach/gridscore/master/public/img/screenshot-timeline.jpg "Timeline")
The timeline shows how many plots have already been scored per trait. This represents the development over time, and can highlight differences in traits or time offsets between traits. The y axis ranges from 0 to 100 percent of scored plots.

### Field heatmap
![](https://raw.githubusercontent.com/sebastian-raubach/gridscore/master/public/img/screenshot-heatmap.jpg "Heatmap")
Sometimes there are factors that can affect certain parts of the field. The heatmap plot shows your data in a colour-coded way to highlight possible localised artifacts. For date and text traits, the heatmap shows the recording date in days after the first data value. For integer and floating point traits, the heatmap shows the actual data value.

### Image tagging
In addition to the features highlighted above, GridScore can prompt your mobile device to take a photo which will then be tagged with the germplasm/variety name and a timestamp to significantly reduce the amount of effort that has to go into organising your photographs later.