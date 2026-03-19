/**
 * ESLint rule: require-button-handler
 * 
 * Ensures all <button> elements have an onClick handler or are inside a form.
 * This prevents "dead" buttons that don't do anything when clicked.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require onClick handler on button elements",
      category: "Best Practices",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      missingHandler: "Button element should have an onClick handler or be inside a form with onSubmit",
    },
  },

  create(context) {
    let isInsideForm = false

    return {
      // Track when we enter/exit a form
      "JSXElement[openingElement.name.name='form']"() {
        isInsideForm = true
      },
      "JSXElement[openingElement.name.name='form']:exit"() {
        isInsideForm = false
      },

      // Check button elements
      "JSXElement[openingElement.name.name='button']"(node) {
        // Skip if inside a form
        if (isInsideForm) return

        // Skip if disabled
        const disabledAttr = node.openingElement.attributes.find(
          (attr) => attr.name && attr.name.name === "disabled"
        )
        if (disabledAttr) return

        // Check for onClick
        const onClickAttr = node.openingElement.attributes.find(
          (attr) => attr.name && attr.name.name === "onClick"
        )

        // Check for type="submit" (implies form context)
        const typeAttr = node.openingElement.attributes.find(
          (attr) => 
            attr.name && 
            attr.name.name === "type" && 
            attr.value && 
            attr.value.value === "submit"
        )

        if (!onClickAttr && !typeAttr) {
          context.report({
            node,
            messageId: "missingHandler",
          })
        }
      },
    }
  },
}
