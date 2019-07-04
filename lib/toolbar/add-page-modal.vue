<style lang="sass">
  @import '../../styleguide/typography';

  .add-page-modal {
    .add-page-button {
      margin-top: 16px;
    }
  }
</style>

<template>
  <form class="add-page-modal" @submit.prevent="addPage">
    <ui-textbox class="add-page-input" v-model.trim="title" :required="true" :autofocus="true" :floatingLabel="true" label="Template Name" help="The current page will be available as a template in the New Pages list, allowing other people to create pages based on it"></ui-textbox>
    <ui-autocomplete class="add-page-input" v-model.trim="category" :required="true" :floatingLabel="true" label="Template Category" help="Select an existing category or add a new one" :suggestions="categories"></ui-autocomplete>
    <ui-button class="add-page-button" color="accent" :disabled="isButtonDisabled">Add Page Template</ui-button>
  </form>
</template>

<script>
  import _ from 'lodash';
  import UiTextbox from 'keen/UiTextbox';
  import UiButton from 'keen/UiButton';
  import UiAutocomplete from 'keen/UiAutocomplete';
  import logger from '../utils/log';
  import { sortPages } from '../lists/helpers';

  const log = logger(__filename);

  export default {
    data() {
      return {
        title: '',
        category: '' // note: categories will match on the `title` attribute
      };
    },
    computed: {
      categories() {
        const pages = _.get(this.$store, 'state.lists[new-pages].items');

        return _.reduce(pages, (categories, page) => {
          if (page.children) {
            categories.push(page.title);
          }
  
          return categories;
        }, []);
      },
      isButtonDisabled() {
        return this.title === '' || this.category === '';
      }
    },
    methods: {
      addPage() {
        const title = this.title,
          categoryID = _.kebabCase(this.category),
          categoryTitle = this.category.split(' ').map(_.capitalize).join(' '), // keeping these consistent, no matter what the user enters
          // note: not using _.startCase here, as it removes punctuation
          uri = _.get(this.$store, 'state.page.uri'),
          id = uri.match(/pages\/([A-Za-z0-9\-]+)/)[1];

        return this.$store.dispatch('updateList', {
          listName: 'new-pages',
          fn: (items) => {
            let currentCategory;

            items = sortPages(items);
            currentCategory = _.find(items, item => item.id === categoryID);

            if (currentCategory) {
            // add to existing category
              currentCategory.children.push({ id, title });
            } else {
            // add to new category
              items.push({
                id: categoryID,
                title: categoryTitle,
                children: [{ id, title }]
              });
            }
  
            return sortPages(items); // sort them again after adding the item (todo: in the future, just put them in the right place)
          }
        })
          .then(() => this.$store.dispatch('closeModal'))
          .then(() => {
            this.$store.dispatch('closeModal');
            this.$store.dispatch('showSnackbar', `Added ${title} to Page Templates`);
            this.$store.commit('CHANGE_FAVORITE_PAGE_CATEGORY', categoryID);
            this.$store.commit('ADD_PAGE_TEMPLATE', `${categoryTitle} - ${title}`);
          }).catch((e) => {
            log.error(`Error adding ${title} to Page Templates: ${e.message}`, { action: 'addPage', uri });
            this.$store.dispatch('closeModal');
            this.$store.dispatch('showSnackbar', `Error adding ${title} to Page Templates`);
          });
      }
    },
    components: {
      UiTextbox,
      UiButton,
      UiAutocomplete
    }
  };
</script>
