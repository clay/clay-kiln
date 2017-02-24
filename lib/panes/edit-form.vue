<template>
  <div class="editor" @click.stop>
    <form @submit.prevent="save">
      <div class="input-container">
        <field v-for="(field, index) in fieldNames" :class="{ 'first-field': !index }" :name="field" :data="fields[field]" :schema="componentSchema[field]"></field>
      </div>
    </form>
  </div>
</template>

<script>
  import field from '../forms/field.vue';

  export default {
    props: ['fieldNames', 'fields', 'componentSchema'],
    data() {
      return {}
    },
    methods: {},
    components: {
      field
    }
  };
</script>
