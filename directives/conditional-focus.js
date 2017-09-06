export default function conditionalFocus() {
  return {
    componentUpdated: (el, { value, oldValue }) => {
      if (value && value !== oldValue) {
        el.focus();
      }
    }
  };
};
