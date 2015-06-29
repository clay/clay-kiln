# Controllers

We are in the process of pulling out logic from our controllers into generic services, and getting rid of our `dollar-slice` dependency. Right now, there are four controllers:

* `component-edit` - instantiated for each component on the page. This adds decorators to editable elements and generally allows you to edit a component
* `editor-toolbar` - instantiated for the toolbar. This adds click events and logic to the toolbar.
* `form` - instantiated when a form is opened.
* `overlay` - instantiated when an overlay is created.
