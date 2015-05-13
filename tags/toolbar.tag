<section data-component="editor-toolbar" class="editor-toolbar">
  <button class="close" onclick={ onClose }>Close</button>
  <button class="meta" onclick={ onMeta }>Edit Story Settings</button>
  <button class="new" onclick={ onNewPage }>New Page</button>
  <button class="publish" onclick={ onPublish }>Publish</button>
</section>

<script>
  var dom = require('../services/dom'),
    db = require('../services/db'),
    edit = require('../services/edit'),
    riot = require('riot');

  // grab the first component in the primary area
  main = dom.find('.main .primary [data-component]');

  // todo: figure out save functionality / autosave
  /*
    idea: autosave happens on a per-component basis
    idea: for now, forms will have explicit save buttons
    question: if I PUT to /component/name/instances/id, is that idempotent? (yes)
    question: should we allow PATCH to /component/name/instances/id with partial data?
   */

  /**
  * goes back to view mode
  */
  onClose() {
    location.href = location.href.split('?').shift();
  }

  /**
   * edit metadata for the main component
   * opens a modal with ???
   */
  onMeta() {
    var main = this.main,
      name = main.getAttribute('data-component'),
      ref = main.getAttribute(references.referenceAttribute);

    edit.getSchemaAndData(ref).then(function (res) {
      var form = formcreator.createForm(name, {schema: res.schema, data: res.data, display: 'meta'}),
        modal = templates.apply('editor-modal', { html: form.outerHTML });

      document.body.appendChild(modal);
      dom.find('html').classList.add('noscroll');

      // instantiate modal and form controllers
      require('./modal.tag');
      require('./form.tag');
      riot.mount(modal, 'modal');
      riot.mount(dom.getFirstChildElement(dom.find(modal, '.editor-modal')), 'form', { ref: ref });
  }

  onNewPage() {
    var articlePage = {
      layout: '/components/nym2015-layout/instances/article',
      main: '/components/story'
    };

    db.postToReference('/pages', articlePage)
      .then(function (res) {
        location.href = res._ref + '.html?edit=true';
      });
  }

  onPublish() {
    alert('published');
    // todo: figure out publish functionality
  }
</script>