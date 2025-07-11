package www

import www.components.{Button, Card}
import www.locator.UIComponent
import www.locator.component
import www.locator.UIComponentSource.withSourcePath

import com.raquo.laminar.api.L.*

case class App() extends UIComponent {
  @component
  def renderLabel(): HtmlElement = {
    div(
      "hello"
    ).withSourcePath
  }

  @component
  def renderStyledButton(): HtmlElement = {
    button(
      "Styled Button",
      backgroundColor("lightblue"),
      padding.px(10),
      borderRadius.px(5),
      border("none"),
      cursor.pointer
    ).withSourcePath
  }
  def render() = {
    div(
      width.px(600),
      height.px(400),
      border("1px solid black"),
      display.flex,
      flexDirection.column,
      padding.px(12),
      alignItems.start,
      Card("Example Card")(
        p("This is some content inside the card."),
        Button()(),
        p("More content here."),
        // Demonstrate the @uicomponent annotation usage
        renderLabel().amend(
          color("blue"),
          fontSize.px(16),
          fontWeight.bold
        ),
        renderStyledButton()
      )
    )
  }
}
