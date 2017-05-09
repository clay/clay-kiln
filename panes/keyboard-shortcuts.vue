<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  .keyboard-shortcuts {
    max-height: 100%;
    overflow-y: scroll;

    .shortcut-section {
      padding: 0 17px 10px;
    }

    .shortcut-section + .shortcut-section {
      border-top: 1px solid $pane-list-divider;
      margin-top: 10px;
    }

    .section-title {
      @include subheader();

      font-weight: 700;
    }

    .shortcut {
      align-items: center;
      display: flex;
      flex-flow: row wrap;
    }

    .shortcut + .shortcut {
      margin-top: 20px;
    }

    .shortcut-title {
      @include input-label();

      color: $subtitle;
      flex: 1 0 auto;
    }

    .shortcut-key {
      @include keyboard-keys();

      flex: 0 0 auto;
      margin-left: 5px;
    }

    .shortcut-description {
      @include kiln-copy();

      flex: 1 0 100%;
      margin-top: 5px;
    }
  }
</style>

<template>
  <div class="keyboard-shortcuts">
    <div v-for="section in sections" class="shortcut-section">
      <h2 class="section-title">{{ section.title }}</h2>
      <div v-for="shortcut in section.shortcuts" class="shortcut">
        <span class="shortcut-title">{{ shortcut.title }}</span>
        <span v-for="key in shortcut.keys" class="shortcut-key">{{ key }}</span>
        <span class="shortcut-description">{{ shortcut.description }}</span>
      </div>
    </div>
  </div>
</template>


<script>
  export default {
    data() {
      return {
        sections: [{
          title: 'General Shortcuts',
          shortcuts: [{
            title: 'Undo and Redo',
            keys: ['⌘+Z / Ctrl+Z', 'Shift+⌘+Z / Shift+Ctrl+Z'],
            description: 'Undo (or redo) your saves, up to 50 times. Note: Navigating away from the page will erase the save history.'
          }, {
            title: 'Navigate Components',
            keys: ['↑', '↓'],
            description: 'When a component is selected, use arrows to navigate up and down within the document. Useful for selecting a component\'s parent component.'
          }, {
            title: 'Close Forms and Panes',
            keys: ['Esc', 'Enter'],
            description: 'Esc closes the current form or pane. Enter closes forms when in single-line inputs (not simple list or multi-line text boxes). Note: Closing a form will always save your data.'
          }, {
            title: 'Add Items to Simple Lists',
            keys: ['Enter / Tab / ,'],
            description: 'Remember to add list items before closing your form.'
          }, {
            title: 'Open Cheat Sheet',
            keys: ['?'],
            description: 'Open this keyboard shortcut cheat sheet.'
          }, {
            title: 'Enter Edit Mode',
            keys: ['Shift+C+L+A+Y'],
            description: 'Hold Shift and type "CLAY" to enter edit mode on any Clay page. If you\'re not logged in, you will be prompted to do so.'
          }]
        }, {
          title: 'WYSIWYG Shortcuts',
          shortcuts: [{
            title: 'Navigate WYSIWYG Components',
            keys: ['← / ↑', '→ / ↓'],
            description: 'Use arrows to navigate between components when editing wysiwyg fields. Useful for things like paragraphs.'
          }, {
            title: 'Split Text Between Components',
            keys: ['Enter'],
            description: 'Like Google Docs or Microsoft Word, use Enter to split paragraphs when text is after the cursor.'
          }, {
            title: 'Merge Text Between Components',
            keys: ['Backspace'],
            description: 'Like Google Docs or Microsoft Word, use Backspace to merge paragraphs when text is after the cursor.'
          }, {
            title: 'Create Fake Bullets',
            keys: ['Tab'],
            descriptions: 'In field where it is enabled, Tab will create fake bullets for use in lists.'
          }, {
            title: 'Bold Text',
            keys: ['⌘+B / Ctrl+B'],
            description: 'Bold text if that format is enabled for the field.'
          }, {
            title: 'Italicize Text',
            keys: ['⌘+I / Ctrl+I'],
            description: 'Italicize text if that format is enabled for the field.'
          }, {
            title: 'Underline Text',
            keys: ['⌘+U / Ctrl+U'],
            description: 'Underline text if that format is enabled for the field.'
          }, {
            title: 'Create Link',
            keys: ['⌘+K / Ctrl+K'],
            description: 'Make text into a link if that format is enabled for the field.'
          }]
        }]
      };
    }
  };
</script>
