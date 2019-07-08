<style lang="sass">
  @import '../../styleguide/typography';

  .add-bookmark-modal {
    .add-bookmark-button {
      margin-top: 16px;
    }
  }
</style>

<template>
  <form class="add-bookmark-modal" @submit.prevent="addBookmark">
    <ui-textbox class="add-bookmark-input" v-model.trim="title" :required="true" :autofocus="true" :floatingLabel="true" label="Bookmark Name" help="Name of this component, so it can be duplicated on other pages"></ui-textbox>
    <ui-button class="add-bookmark-button" color="accent" :disabled="title === ''">Add Bookmark</ui-button>
  </form>
</template>

<script>
  import _ from 'lodash';
  import UiTextbox from 'keen/UiTextbox';
  import UiButton from 'keen/UiButton';
  import logger from '../utils/log';
  import { getComponentName } from '../utils/references';
  import label from '../utils/label';

  const log = logger(__filename);

  export default {
    props: ['data'],
    data() {
      return {
        title: ''
      };
    },
    methods: {
      addBookmark() {
        const title = this.title,
          uri = this.data,
          name = getComponentName(uri),
          componentLabel = label(name);

        return this.$store.dispatch('updateList', {
          listName: 'bookmarks',
          fn: (items) => {
            const currentComponentBookmarks = _.find(items, item => item.name === name);

            if (currentComponentBookmarks) {
            // add to existing component bookmarks
              currentComponentBookmarks.children.push({ id: uri, title });
            } else {
            // add to new component bookmarks
              items.push({
                name,
                children: [{ id: uri, title }]
              });
            }
  
            return items;
          }
        })
          .then(() => this.$store.dispatch('closeModal'))
          .then(() => {
            this.$store.dispatch('closeModal');
            this.$store.dispatch('showSnackbar', `Added ${title} to ${componentLabel} Bookmarks`);
          }).catch((e) => {
            log.error(`Error adding ${title} to ${componentLabel} Bookmarks: ${e.message}`, { action: 'addBookmark', uri });
            this.$store.dispatch('closeModal');
            this.$store.dispatch('showSnackbar', `Error adding ${title} to ${componentLabel} Bookmarks`);
          });
      }
    },
    components: {
      UiTextbox,
      UiButton
    }
  };
</script>
