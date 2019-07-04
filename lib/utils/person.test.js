import Person from './person.vue';

describe('person component', () => {
  test('renders with no props', () => {
    const wrapper = shallowMount(Person);

    expect(wrapper.html()).toContain('<div class="person-item"');
  });

  test('has primary action class if action prop is specified', () => {
    const wrapper = shallowMount(Person, { propsData: { hasPrimaryAction: true } });

    expect(wrapper.html()).toContain('<div class="person-item has-primary-action">');
  });

  test('uses name if it exists', () => {
    const wrapper = shallowMount(Person, { propsData: { name: 'Bob' } });

    expect(wrapper.html()).toContain('<span class="person-name">Bob</span>');
  });

  test('uses subtitle if it exists', () => {
    const wrapper = shallowMount(Person, { propsData: { subtitle: 'Mary' } });

    expect(wrapper.html()).toContain('<span class="person-subtitle">Mary</span>');
    expect(wrapper.html()).not.toContain('<span class="person-name">Bob</span>');
  });

  test('includes actions if they exist', () => {
    expect(shallowMount(Person, { propsData: { hasToggle: true } }).html()).toContain('<div class="person-actions">');
    expect(shallowMount(Person, { propsData: { hasSecondaryAction: true } }).html()).toContain('<div class="person-actions">');
    expect(shallowMount(Person, { propsData: { hasPrimaryAction: true } }).html()).not.toContain('<div class="person-actions">');
  });
});
