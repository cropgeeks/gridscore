---
title: GridScore Workflow
---

# Workflow

Often it may be required to collect data on multiple devices for the same trial. While it's easy to <a href="trial-setup.html">set up a trial</a> and to <a href="sharing.html">share it</a> to another device, there is a certain workflow that needs to be followed when collecting data on multiple devices for the same trial.

**Please note, that it's currently not possible to score data on the same trial concurrently.**

Let's assume there are two devices, `A` and `B`. The trial in question has been shared to both devices and is currently empty, i.e. no data has been recorded yet. The workflow for each device will be as follows:

1. Load latest version of data from GridScore server.
2. Record data using GridScore.
3. Save data back to GridScore server.

What's important is that when following this workflow on device `A`, you mustn't start the workflow on device `B` until after device `A` has completed step 3.

As an example, the following workflow is valid: `A1, A2, A3, B1, B2, B3, B1, B2, B3, A1, A2, A3`. In this example, device `A` is used to score part of the trial, then device `B`, followed by device `B` again and finally device `A`.

When mixing devices between complete runs of the workflow, your data may be overwritten. Take this sequence for example: `A1, A2, B1, B2, A3, B3`. In this case, device `A` loads the data and starts scoring, then device `B` does the same, finally device `A` writes the data back to the server and so does device `B`. The result of this will be that the final write operation of device `B` will overwrite any changes made by device `A`, because the workflow of `A` hadn't been completed before starting another cycle with device `B`.