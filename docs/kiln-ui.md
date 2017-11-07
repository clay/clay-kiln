# The Kiln UI

When viewing Clay pages while logged in, Kiln provides two separate experiences: View Mode and Edit Mode.

## View Mode

This mode displays pages as they would appear on the public-facing site. Client-side controllers run, ads fire, and embeds are fully functional. Kiln's entire UI is relegated to two small buttons in the upper left hand corner: The _Clay Menu_ button allows you to open up the Clay Menu, while the _Edit Page_ button reloads the page in Edit Mode.

![](assets/Screen Shot 2017-11-06 at 4.12.55 PM.png)

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
![](assets/Screen Shot 2017-11-06 at 4.11.13 PM.png)
