# The Kiln UI

When viewing Clay pages while logged in, Kiln provides two separate experiences: View Mode and Edit Mode.

## View Mode

This mode displays pages as they would appear on the public-facing site. Client-side controllers run, ads fire, and embeds are fully functional. Kiln's entire UI is relegated to two small buttons in the upper left hand corner: The _Clay Menu_ button allows you to open up the Clay Menu, while the _Edit Page_ button reloads the page in Edit Mode.

![](images/view_mode.png)

## Edit Mode

This mode displays the page without any client-side controllers, allowing Kiln to modify and re-render components as you're editing them. A toolbar displays at the top of the screen, with various buttons and actions available.

* The _Clay Menu_ button opens up the Clay Menu, allowing you to search through pages, create new pages, and \(if you're an admin\) modify Clay users
* The _Page Status_ displays the current state of the page \(_Draft_, _Scheduled_, _Published_, or published with _Unpublished Changes_\), and allows you to go back to View Mode
* The _Undo_ and _Redo_ buttons \(which are enabled if you can perform those actions\) allow you to step backwards and forwards through changes in your current editing session
* The _Contributors_, _Find on Page_, _Preview_, and _Publish_ \(or _Republish_, if you've already published the page\) buttons toggle drawers on the right side of the page
  * **Contributors** shows the users who have edited this page, and allows you to add other users to the page. This will make the page show up in their _My Pages_ list in the Clay Menu
  * **Find on Page** displays lists of visible components \(components that live in the `<body>` and are not visually hidden\), allowing quick search and navigation of components on the page. It also has tabs for components in the `<head>` as well as lists of hidden \(_invisible_\) components
  * **Preview** allows you to preview the current page in various form factors \(for small, medium, and large screens\), as well as provides a shareable link to allow others to preview this page before you publish it
  * **Publish** determines the health of the page \(its ability to be published, based on built-in and custom validation rules\) and allows you to _Publish Now_ or _Schedule_ a page to be published in the future. It also allows you to set a _Custom URL_, which is useful for index pages and other pages that do not automatically generate URLs

![](images/edit_mode.png)

## Component Selectors

Attached to every component is a component selector, which displays when the component is hovered over or clicked. Depending on the component and where it exists on the page, the selector may have these buttons:

* **Info** - provides component information taken from the `_description` in the component's schema
* **Settings** - opens the [component settings form](editing-components.md#settings-group), if it exists
* **Bookmark** - allows saving a specifically-named instance that can be duplicated on other pages (if `_allowBookmarks: true` is set in the component's schema)
* **Remove** - removes the component, if it exists in a component list
* **Add Component** - adds a component, if the current component exists in a component list
* **Add Another** - adds another instance of the current component
* **Duplicate Component** - holding <kbd>Ctrl</kbd> or <kbd>⌘</kbd> will change the _Add Another button into a _Duplicate Component_ button, creating a new instance of the current component with a copy of the current component's data

![](images/component_selector.png)

> #### info::Confirm Removal
>
> By default, there is no confirmation when users remove components, since they can press undo to revert their actions. For additional peace-of-mind in large editorial teams, you may also add a root-level `_confirmRemoval` property to your component schema, which will force the user to _type the component's name_ when trying to remove it.
>
> ![](images/confirm.png)
