export default function conditionalFocus() {
  return {
    componentUpdated: (el, { value, oldValue }) => {
      if (value && value !== oldValue) {
        if (el.classList.contains('ui-textbox')) {
          el.querySelector('input').focus();
        } else {
          el.focus();
        }
      }
    }
  };
};
