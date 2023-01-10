# GridScore

<p align="center">
  <img src="https://raw.githubusercontent.com/cropgeeks/gridscore/master/public/img/gridscore2.svg?sanitize=true" width="200" alt="Logo">
</p>

![GitHub License](https://img.shields.io/github/license/cropgeeks/gridscore?style=for-the-badge&logo=apache)
![GitHub package.json version](https://img.shields.io/github/package-json/v/cropgeeks/gridscore?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/cropgeeks/gridscore?style=for-the-badge&logo=git)

![Docker Pulls](https://img.shields.io/docker/pulls/cropgeeks/gridscore?style=for-the-badge)
[![Docker CI Tag](https://img.shields.io/github/actions/workflow/status/cropgeeks/gridscore/docker-ci-multi-arch-tag.yml?label=Docker%20CI%20Push&logo=github&style=for-the-badge)](https://github.com/germinateplatform/germinate-vue/actions/workflows/docker-ci-tag.yml)

[![DOI](https://zenodo.org/badge/270078734.svg?style=flat-square)](https://zenodo.org/badge/latestdoi/270078734)

GridScore is a field trial phenotyping app for trait data. It lets you keep track of what's happening in the field on a plot-level basis. This could be anything from plant emergence, flowering date, plant height, flower colour, etc. You can define the layout of your field trial and the traits you want to score. GridScore then presents your data in a table format representing your field layout. Data is recorded by clicking on a specific plot in a field and then entering your data.

![](https://raw.githubusercontent.com/cropgeeks/gridscore/master/public/img/screenshot-grid.png "GridScore main screen")

## Data
All your data is stored in the app and can be exported at any time. This, however, also means that your data is at the mercy of the operating system's data retention policy. Android does not automatically delete the data, unless the user clears the browser's data manually. On iOS, recent changes mean that Apple will delete any website's (and by extension any PWA's) data after 7 days if the app hasn't been used in the meantime. We therefore recommend to regularly export your data and ideally open the app every few days to prevent iOS from deleting your data. To be safe, stick to Android devices for now.

## Installation and Documentation

There is detailed information about what GridScore can do and how to use it available on the dedicated website: https://cropgeeks.github.io/gridscore/

## GridScore link

GridScore is available at https://ics.hutton.ac.uk/gridscore