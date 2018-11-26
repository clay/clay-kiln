<docs>
  # `inline`

  A multi-line text input which allows a rich editing experience, but appears inline rather than in a form. It will inherit styles from the component you're editing, rather than looking like a Kiln text input. [It supports exactly the same arguments and returns the same format as `wysiwyg`.](inputs.md#wysiwyg)
</docs>

<template>
  <component is="wysiwyg" :name="name" :data="data" :schema="schema" :args="args" :initialFocus="initialFocus"></component>
</template>

<script>
  import wysiwyg from './wysiwyg.vue';

  export default {
    props: ['name', 'data', 'schema', 'args', 'initialFocus'],
    data() {
      return {};
    },
    components: {
      wysiwyg
    }
  };
</script>
