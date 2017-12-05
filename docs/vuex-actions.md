## Modules

<dl>
<dt><a href="#module_component-data">component-data</a></dt>
<dd></dd>
<dt><a href="#module_decorators">decorators</a></dt>
<dd></dd>
<dt><a href="#module_deep-linking">deep-linking</a></dt>
<dd></dd>
<dt><a href="#module_drawers">drawers</a></dt>
<dd></dd>
<dt><a href="#module_forms">forms</a></dt>
<dd></dd>
<dt><a href="#module_lists">lists</a></dt>
<dd></dd>
<dt><a href="#module_nav">nav</a></dt>
<dd></dd>
<dt><a href="#module_page-data">page-data</a></dt>
<dd></dd>
<dt><a href="#module_page-state">page-state</a></dt>
<dd></dd>
<dt><a href="#module_preloader">preloader</a></dt>
<dd></dd>
<dt><a href="#module_toolbar">toolbar</a></dt>
<dd></dd>
<dt><a href="#module_undo">undo</a></dt>
<dd></dd>
<dt><a href="#module_validators">validators</a></dt>
<dd></dd>
</dl>

<a name="module_component-data"></a>

## component-data

* [component-data](#module_component-data)
    * _static_
        * [.saveComponent(store, uri, data, [eventID], [snapshot], [prevData])](#module_component-data.saveComponent) ⇒ <code>Promise</code>
        * [.removeComponent(store, el)](#module_component-data.removeComponent) ⇒ <code>Promise</code>
        * [.removeHeadComponent(store, startNode)](#module_component-data.removeHeadComponent) ⇒ <code>Promise</code>
        * [.addComponents(store, [currentURI], parentURI, path, [replace], [clone], components)](#module_component-data.addComponents) ⇒ <code>Promise</code>
        * [.openAddComponent(store, [currentURI], parentURI, path)](#module_component-data.openAddComponent) ⇒ <code>Promise</code>
    * _inner_
        * [~logSaveError(uri, e, data, [eventID], [snapshot], store)](#module_component-data..logSaveError)
        * [~revertReject(uri, data, [snapshot], paths, store)](#module_component-data..revertReject) ⇒ <code>Promise</code>
        * [~clientSave(uri, data, oldData, store, [eventID], [snapshot], paths)](#module_component-data..clientSave) ⇒ <code>Promise</code>
        * [~findIndex(data, [uri])](#module_component-data..findIndex) ⇒ <code>number</code>
        * [~addComponentsToComponentList(store, data, [currentURI], parentURI, path, [replace], [clone], components)](#module_component-data..addComponentsToComponentList) ⇒ <code>Promise</code>
        * [~addComponentsToComponentProp(store, data, parentURI, path, components, [clone])](#module_component-data..addComponentsToComponentProp) ⇒ <code>Promise</code>
        * [~addComponentsToPageArea(store, currentURI, path, replace, components, [clone])](#module_component-data..addComponentsToPageArea) ⇒ <code>Promise</code>

<a name="module_component-data.saveComponent"></a>

### component-data.saveComponent(store, uri, data, [eventID], [snapshot], [prevData]) ⇒ <code>Promise</code>
save a component's data and re-render

**Kind**: static method of [<code>component-data</code>](#module_component-data)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| uri | <code>string</code> |  |
| data | <code>object</code> | (may be a subset of the data) |
| [eventID] | <code>string</code> | when saving from a pubsub subscription |
| [snapshot] | <code>boolean</code> | set to false if save is triggered by undo/redo |
| [prevData] | <code>object</code> | manually passed in when undoing/redoing (because the store has already been updated) |

<a name="module_component-data.removeComponent"></a>

### component-data.removeComponent(store, el) ⇒ <code>Promise</code>
remove a component from its parent
note: removes from parent component OR page

**Kind**: static method of [<code>component-data</code>](#module_component-data)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| el | <code>Element</code> | inside the component to delete |

<a name="module_component-data.removeHeadComponent"></a>

### component-data.removeHeadComponent(store, startNode) ⇒ <code>Promise</code>
remove head components (from page or layout)

**Kind**: static method of [<code>component-data</code>](#module_component-data)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| startNode | <code>Node</code> | comment with data-uri |

<a name="module_component-data.addComponents"></a>

### component-data.addComponents(store, [currentURI], parentURI, path, [replace], [clone], components) ⇒ <code>Promise</code>
add components to a parent component (or page)
note: allows multiple components to be added at once
note: always creates new instances of the components you're adding
note: allows you to replace a specific uri, or add components after it
note: if no currentURI passed in, it will add new components to the end (and won't replace anything)

**Kind**: static method of [<code>component-data</code>](#module_component-data)  
**Returns**: <code>Promise</code> - with the last added component's el  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| [currentURI] | <code>string</code> | if adding after / replacing a specific component |
| parentURI | <code>string</code> |  |
| path | <code>string</code> |  |
| [replace] | <code>boolean</code> | to replace the current URI |
| [clone] | <code>boolean</code> | to clone ALL child component references, not just default instances |
| components | <code>array</code> | to add (object with name and [data]) |

<a name="module_component-data.openAddComponent"></a>

### component-data.openAddComponent(store, [currentURI], parentURI, path) ⇒ <code>Promise</code>
open the add components pane, or add a new components

**Kind**: static method of [<code>component-data</code>](#module_component-data)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| [currentURI] | <code>string</code> | if we're inserting after a specific component |
| parentURI | <code>string</code> |  |
| path | <code>string</code> |  |

<a name="module_component-data..logSaveError"></a>

### component-data~logSaveError(uri, e, data, [eventID], [snapshot], store)
log errors when components save and display them to the user

**Kind**: inner method of [<code>component-data</code>](#module_component-data)  

| Param | Type |
| --- | --- |
| uri | <code>string</code> | 
| e | <code>Error</code> | 
| data | <code>object</code> | 
| [eventID] | <code>string</code> | 
| [snapshot] | <code>boolean</code> | 
| store | <code>object</code> | 

<a name="module_component-data..revertReject"></a>

### component-data~revertReject(uri, data, [snapshot], paths, store) ⇒ <code>Promise</code>
re-render (reverting) a component and stop the saving promise chain

**Kind**: inner method of [<code>component-data</code>](#module_component-data)  

| Param | Type |
| --- | --- |
| uri | <code>string</code> | 
| data | <code>object</code> | 
| [snapshot] | <code>boolean</code> | 
| paths | <code>array</code> | 
| store | <code>object</code> | 

<a name="module_component-data..clientSave"></a>

### component-data~clientSave(uri, data, oldData, store, [eventID], [snapshot], paths) ⇒ <code>Promise</code>
save data client-side and queue up api call for the server
note: this uses the components' model.js (if it exists) and handlebars template
note: server-side saving and/or re-rendering has been removed in kiln v4.x

**Kind**: inner method of [<code>component-data</code>](#module_component-data)  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> |  |
| data | <code>object</code> |  |
| oldData | <code>object</code> |  |
| store | <code>object</code> |  |
| [eventID] | <code>string</code> |  |
| [snapshot] | <code>boolean</code> | passed through to render |
| paths | <code>array</code> |  |

<a name="module_component-data..findIndex"></a>

### component-data~findIndex(data, [uri]) ⇒ <code>number</code>
find the index of a uri in a list
this is broken out into a separate function so we don't assume an index of 0 is falsy

**Kind**: inner method of [<code>component-data</code>](#module_component-data)  

| Param | Type |
| --- | --- |
| data | <code>array</code> | 
| [uri] | <code>string</code> | 

<a name="module_component-data..addComponentsToComponentList"></a>

### component-data~addComponentsToComponentList(store, data, [currentURI], parentURI, path, [replace], [clone], components) ⇒ <code>Promise</code>
add one or more components to a component list

**Kind**: inner method of [<code>component-data</code>](#module_component-data)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| data | <code>array</code> | list data |
| [currentURI] | <code>string</code> | if you want to add after / replace a specific current component |
| parentURI | <code>string</code> |  |
| path | <code>string</code> | of the list |
| [replace] | <code>boolean</code> | to replace currentURI |
| [clone] | <code>boolean</code> | to clone ALL child component references, not just default instances |
| components | <code>array</code> | with { name, [data] } |

<a name="module_component-data..addComponentsToComponentProp"></a>

### component-data~addComponentsToComponentProp(store, data, parentURI, path, components, [clone]) ⇒ <code>Promise</code>
replace a single component in another component's property

**Kind**: inner method of [<code>component-data</code>](#module_component-data)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| data | <code>object</code> |  |
| parentURI | <code>string</code> |  |
| path | <code>string</code> |  |
| components | <code>array</code> | note: it'll only replace using the first thing in this array |
| [clone] | <code>boolean</code> | to clone ALL child component references, not just default instances |

<a name="module_component-data..addComponentsToPageArea"></a>

### component-data~addComponentsToPageArea(store, currentURI, path, replace, components, [clone]) ⇒ <code>Promise</code>
add one or more components to a page area

**Kind**: inner method of [<code>component-data</code>](#module_component-data)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| currentURI | <code>string</code> |  |
| path | <code>string</code> |  |
| replace | <code>boolean</code> |  |
| components | <code>array</code> |  |
| [clone] | <code>boolean</code> | to clone ALL child component references, not just default instances |

<a name="module_decorators"></a>

## decorators

* [decorators](#module_decorators)
    * [.unselect(store)](#module_decorators.unselect)
    * [.select(store, el)](#module_decorators.select)
    * [.scrollToComponent(store, el)](#module_decorators.scrollToComponent)
    * [.navigateComponents(store, direction)](#module_decorators.navigateComponents) ⇒ <code>Promise</code>
    * [.unfocus(store)](#module_decorators.unfocus) ⇒ <code>Promise</code>

<a name="module_decorators.unselect"></a>

### decorators.unselect(store)
unselect currently-selected component

**Kind**: static method of [<code>decorators</code>](#module_decorators)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 

<a name="module_decorators.select"></a>

### decorators.select(store, el)
select a component

**Kind**: static method of [<code>decorators</code>](#module_decorators)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 
| el | <code>element</code> | 

<a name="module_decorators.scrollToComponent"></a>

### decorators.scrollToComponent(store, el)
Scroll user to the component. "Weeee!" or "What the?"

**Kind**: static method of [<code>decorators</code>](#module_decorators)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 
| el | <code>Element</code> | 

<a name="module_decorators.navigateComponents"></a>

### decorators.navigateComponents(store, direction) ⇒ <code>Promise</code>
navigate to the previous or next component

**Kind**: static method of [<code>decorators</code>](#module_decorators)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| direction | <code>string</code> | 'prev' or 'next' |

<a name="module_decorators.unfocus"></a>

### decorators.unfocus(store) ⇒ <code>Promise</code>
unfocus currently-focused field/group

**Kind**: static method of [<code>decorators</code>](#module_decorators)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 

<a name="module_deep-linking"></a>

## deep-linking

* [deep-linking](#module_deep-linking)
    * [.parseURLHash(store)](#module_deep-linking.parseURLHash) ⇒ <code>Promise</code>
    * [.setHash(commit, [uri], [path], [menu])](#module_deep-linking.setHash)
    * [.clearHash(commit)](#module_deep-linking.clearHash)

<a name="module_deep-linking.parseURLHash"></a>

### deep-linking.parseURLHash(store) ⇒ <code>Promise</code>
parse url hash, opening form or clay menu as necessary

**Kind**: static method of [<code>deep-linking</code>](#module_deep-linking)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 

<a name="module_deep-linking.setHash"></a>

### deep-linking.setHash(commit, [uri], [path], [menu])
set hash in window and store

**Kind**: static method of [<code>deep-linking</code>](#module_deep-linking)  

| Param | Type |
| --- | --- |
| commit | <code>function</code> | 
| [uri] | <code>string</code> | 
| [path] | <code>string</code> | 
| [menu] | <code>object</code> | 

<a name="module_deep-linking.clearHash"></a>

### deep-linking.clearHash(commit)
clear hash in window and store

**Kind**: static method of [<code>deep-linking</code>](#module_deep-linking)  

| Param | Type |
| --- | --- |
| commit | <code>function</code> | 

<a name="module_drawers"></a>

## drawers
<a name="module_drawers.closeDrawer"></a>

### drawers.closeDrawer(store)
close drawer without toggling a new drawer

**Kind**: static method of [<code>drawers</code>](#module_drawers)  

| Param | Type |
| --- | --- |
| store | <code>Object</code> | 

<a name="module_forms"></a>

## forms

* [forms](#module_forms)
    * _static_
        * [.openForm(store, uri, path, el, offset, appendText, pos)](#module_forms.openForm)
    * _inner_
        * [~hasDataChanged(newData, oldData)](#module_forms..hasDataChanged) ⇒ <code>Boolean</code>

<a name="module_forms.openForm"></a>

### forms.openForm(store, uri, path, el, offset, appendText, pos)
open form

**Kind**: static method of [<code>forms</code>](#module_forms)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| uri | <code>string</code> | component uri |
| path | <code>string</code> | field/form path |
| el | <code>Element</code> | parent element (for inline forms) |
| offset | <code>number</code> | caret offset (for text inputs) |
| appendText | <code>string</code> | text to append (for text inputs, used when splitting/merging components with text fields) |
| pos | <code>object</code> | x/y coordinates used to position overlay forms |

<a name="module_forms..hasDataChanged"></a>

### forms~hasDataChanged(newData, oldData) ⇒ <code>Boolean</code>
determine if data in form has changed
note: convert data to plain objects, since they're reactive

**Kind**: inner method of [<code>forms</code>](#module_forms)  

| Param | Type | Description |
| --- | --- | --- |
| newData | <code>object</code> | from form |
| oldData | <code>object</code> | from store |

<a name="module_lists"></a>

## lists
<a name="module_nav"></a>

## nav
<a name="module_nav.openNav"></a>

### nav.openNav(store, nameOrConfig)
open nav tab

**Kind**: static method of [<code>nav</code>](#module_nav)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| nameOrConfig | <code>string</code> \| <code>object</code> | tab name, or clay menu config |

<a name="module_page-data"></a>

## page-data

* [page-data](#module_page-data)
    * _static_
        * [.savePage(store, data, [snapshot])](#module_page-data.savePage) ⇒ <code>Promise</code>
        * [.unpublishPage(store, uri)](#module_page-data.unpublishPage) ⇒ <code>Promise</code>
    * _inner_
        * [~shouldRender(paths)](#module_page-data..shouldRender) ⇒ <code>boolean</code>
        * [~removeURI(uri, store)](#module_page-data..removeURI) ⇒ <code>Promise</code>
        * [~unschedule(uri)](#module_page-data..unschedule) ⇒ <code>string</code>

<a name="module_page-data.savePage"></a>

### page-data.savePage(store, data, [snapshot]) ⇒ <code>Promise</code>
save a page's data, but do not re-render
because, uh, that would just be reloading the page

**Kind**: static method of [<code>page-data</code>](#module_page-data)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| data | <code>\*</code> | to save |
| [snapshot] | <code>boolean</code> | false if we're undoing/redoing |

<a name="module_page-data.unpublishPage"></a>

### page-data.unpublishPage(store, uri) ⇒ <code>Promise</code>
remove uri from /uris/

**Kind**: static method of [<code>page-data</code>](#module_page-data)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 
| uri | <code>string</code> | 

<a name="module_page-data..shouldRender"></a>

### page-data~shouldRender(paths) ⇒ <code>boolean</code>
iterate through the paths we're saving
if one of them ISN'T in the internalPageProps, we should re-render

**Kind**: inner method of [<code>page-data</code>](#module_page-data)  

| Param | Type |
| --- | --- |
| paths | <code>array</code> | 

<a name="module_page-data..removeURI"></a>

### page-data~removeURI(uri, store) ⇒ <code>Promise</code>
remove uri from /uris/

**Kind**: inner method of [<code>page-data</code>](#module_page-data)  

| Param | Type |
| --- | --- |
| uri | <code>String</code> | 
| store | <code>Object</code> | 

<a name="module_page-data..unschedule"></a>

### page-data~unschedule(uri) ⇒ <code>string</code>
if something is scheduled, remove it

**Kind**: inner method of [<code>page-data</code>](#module_page-data)  
**Returns**: <code>string</code> - schedule entry removed  

| Param | Type |
| --- | --- |
| uri | <code>string</code> | 

<a name="module_page-state"></a>

## page-state

* [page-state](#module_page-state)
    * [.updatePageList(store, [data])](#module_page-state.updatePageList)
    * [.getListData(store, uri, [prefix])](#module_page-state.getListData) ⇒ <code>Promise</code>

<a name="module_page-state.updatePageList"></a>

### page-state.updatePageList(store, [data])
update page list with data provided from pubsub
note: if called without data, this just updates the updateTime and user
(e.g. when saving components in the page)
note: if called with a user, it adds the user (with updateTime) to the page (instead of current user)

**Kind**: static method of [<code>page-state</code>](#module_page-state)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 
| [data] | <code>object</code> | 

<a name="module_page-state.getListData"></a>

### page-state.getListData(store, uri, [prefix]) ⇒ <code>Promise</code>
get the list data for a specific page
note: if prefix is specified, this does NOT commit the data (only returns it),
allowing the preloader to use it when doing the initial preload of data

**Kind**: static method of [<code>page-state</code>](#module_page-state)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| uri | <code>string</code> |  |
| [prefix] | <code>string</code> | passed in when preloading (e.g. if site isn't in store yet) |

<a name="module_preloader"></a>

## preloader

* [preloader](#module_preloader)
    * [~getLayoutSchema(schemas, layoutRef)](#module_preloader..getLayoutSchema) ⇒ <code>object</code>
    * [~reduceComponents(result, val)](#module_preloader..reduceComponents) ⇒ <code>obj</code>
    * [~composeLayoutData(layoutSchema, components, original)](#module_preloader..composeLayoutData) ⇒ <code>object</code>
    * [~reduceTemplates(result, val, key)](#module_preloader..reduceTemplates) ⇒ <code>obj</code>
    * [~getPageStatus(state)](#module_preloader..getPageStatus) ⇒ <code>string</code>

<a name="module_preloader..getLayoutSchema"></a>

### preloader~getLayoutSchema(schemas, layoutRef) ⇒ <code>object</code>
get schema for a layout

**Kind**: inner method of [<code>preloader</code>](#module_preloader)  

| Param | Type |
| --- | --- |
| schemas | <code>object</code> | 
| layoutRef | <code>string</code> | 

<a name="module_preloader..reduceComponents"></a>

### preloader~reduceComponents(result, val) ⇒ <code>obj</code>
extract component data from preloadData obj

**Kind**: inner method of [<code>preloader</code>](#module_preloader)  

| Param | Type |
| --- | --- |
| result | <code>obj</code> | 
| val | <code>obj</code> | 

<a name="module_preloader..composeLayoutData"></a>

### preloader~composeLayoutData(layoutSchema, components, original) ⇒ <code>object</code>
extract layout data from original data

**Kind**: inner method of [<code>preloader</code>](#module_preloader)  

| Param | Type | Description |
| --- | --- | --- |
| layoutSchema | <code>object</code> | schema for layout |
| components | <code>object</code> | key/value store of components |
| original | <code>object</code> | original preloaded data |

<a name="module_preloader..reduceTemplates"></a>

### preloader~reduceTemplates(result, val, key) ⇒ <code>obj</code>
make precompiled hbs templates ready for user

**Kind**: inner method of [<code>preloader</code>](#module_preloader)  

| Param | Type |
| --- | --- |
| result | <code>obj</code> | 
| val | <code>obj</code> | 
| key | <code>string</code> | 

<a name="module_preloader..getPageStatus"></a>

### preloader~getPageStatus(state) ⇒ <code>string</code>
get string state to pass to progress bar

**Kind**: inner method of [<code>preloader</code>](#module_preloader)  

| Param | Type |
| --- | --- |
| state | <code>object</code> | 

<a name="module_toolbar"></a>

## toolbar

* [toolbar](#module_toolbar)
    * [.startProgress(commit, type)](#module_toolbar.startProgress)
    * [.finishProgress(commit, type)](#module_toolbar.finishProgress)
    * [.addAlert(store, config)](#module_toolbar.addAlert)
    * [.removeAlert(store, config)](#module_toolbar.removeAlert)
    * [.showSnackbar(store, config)](#module_toolbar.showSnackbar)

<a name="module_toolbar.startProgress"></a>

### toolbar.startProgress(commit, type)
start progress bar. if already started, this will cause a slight pause
before continuing the progress bar

**Kind**: static method of [<code>toolbar</code>](#module_toolbar)  

| Param | Type | Description |
| --- | --- | --- |
| commit | <code>function</code> |  |
| type | <code>string</code> | e.g. 'save' or 'publish' |

<a name="module_toolbar.finishProgress"></a>

### toolbar.finishProgress(commit, type)
finish the progress bar.

**Kind**: static method of [<code>toolbar</code>](#module_toolbar)  

| Param | Type | Description |
| --- | --- | --- |
| commit | <code>function</code> |  |
| type | <code>string</code> | e.g. 'save' or 'publish' |

<a name="module_toolbar.addAlert"></a>

### toolbar.addAlert(store, config)
add alert to the array

**Kind**: static method of [<code>toolbar</code>](#module_toolbar)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| config | <code>string</code> \| <code>object</code> | the text of the alert (for info), or an object with { type, text } |

<a name="module_toolbar.removeAlert"></a>

### toolbar.removeAlert(store, config)
remove an alert from the array, specifying the index

**Kind**: static method of [<code>toolbar</code>](#module_toolbar)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| config | <code>number</code> \| <code>object</code> | index or an equivalent config object |

<a name="module_toolbar.showSnackbar"></a>

### toolbar.showSnackbar(store, config)
trigger a new snackbar. note: this happens imperatively (toolbar handles the actual creation, by watching this value)
note: if you want the snackbar to have an action, pass in both `action` (the text of the button) and `onActionClick` (a reference to the function you want invoked)

**Kind**: static method of [<code>toolbar</code>](#module_toolbar)  

| Param | Type | Description |
| --- | --- | --- |
| store | <code>object</code> |  |
| config | <code>string</code> \| <code>object</code> | message or full config object |

<a name="module_undo"></a>

## undo

* [undo](#module_undo)
    * _static_
        * [.createSnapshot(store)](#module_undo.createSnapshot)
        * [.setFixedPoint(store)](#module_undo.setFixedPoint)
        * [.undo(store)](#module_undo.undo)
        * [.redo(store)](#module_undo.redo)
    * _inner_
        * [~getChangedComponents(current, compare)](#module_undo..getChangedComponents) ⇒ <code>object</code>
        * [~saveChangedComponents(changedComponents, store)](#module_undo..saveChangedComponents)

<a name="module_undo.createSnapshot"></a>

### undo.createSnapshot(store)
create snapshot. called from the plugin listening to batched renders

**Kind**: static method of [<code>undo</code>](#module_undo)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 

<a name="module_undo.setFixedPoint"></a>

### undo.setFixedPoint(store)
"You're a fixed point in time and space. You're a fact. That's never meant to happen."
when doing a manual save from some point in history, we need to
remove snapshots after that point (to preserve the expected undo functionality)

**Kind**: static method of [<code>undo</code>](#module_undo)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 

<a name="module_undo.undo"></a>

### undo.undo(store)
undo: sets cursor back one, re-saves affected components with old data

**Kind**: static method of [<code>undo</code>](#module_undo)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 

<a name="module_undo.redo"></a>

### undo.redo(store)
redo: sets cursor forward one, re-saves affected components with new data

**Kind**: static method of [<code>undo</code>](#module_undo)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 

<a name="module_undo..getChangedComponents"></a>

### undo~getChangedComponents(current, compare) ⇒ <code>object</code>
get changed components, used by undo and redo

**Kind**: inner method of [<code>undo</code>](#module_undo)  

| Param | Type | Description |
| --- | --- | --- |
| current | <code>object</code> |  |
| compare | <code>object</code> | (prev/next components object) |

<a name="module_undo..saveChangedComponents"></a>

### undo~saveChangedComponents(changedComponents, store)
render multiple components at once

**Kind**: inner method of [<code>undo</code>](#module_undo)  

| Param | Type |
| --- | --- |
| changedComponents | <code>object</code> | 
| store | <code>object</code> | 

<a name="module_validators"></a>

## validators

* [validators](#module_validators)
    * _static_
        * [.validate(store)](#module_validators.validate) ⇒ <code>Promise</code>
    * _inner_
        * [~runValidator(state)](#module_validators..runValidator) ⇒ <code>function</code>
        * [~runValidators(validators, state)](#module_validators..runValidators) ⇒ <code>Promise</code>

<a name="module_validators.validate"></a>

### validators.validate(store) ⇒ <code>Promise</code>
trigger validation

**Kind**: static method of [<code>validators</code>](#module_validators)  

| Param | Type |
| --- | --- |
| store | <code>object</code> | 

<a name="module_validators..runValidator"></a>

### validators~runValidator(state) ⇒ <code>function</code>
run an individual validator. if it returns items, add the label and description

**Kind**: inner method of [<code>validators</code>](#module_validators)  

| Param | Type |
| --- | --- |
| state | <code>object</code> | 

<a name="module_validators..runValidators"></a>

### validators~runValidators(validators, state) ⇒ <code>Promise</code>
run a list of validators

**Kind**: inner method of [<code>validators</code>](#module_validators)  

| Param | Type |
| --- | --- |
| validators | <code>array</code> | 
| state | <code>object</code> | 

