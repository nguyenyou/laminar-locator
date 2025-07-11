// Copyright (C) 2014-2025 Anduin Transactions Inc.

package www.locator

import scala.annotation.StaticAnnotation
import scala.scalajs.LinkingInfo.developmentMode

import com.raquo.laminar.api.L.*
import com.raquo.laminar.codecs.{IntAsStringCodec, StringAsIsCodec}

/** @component
  *   annotation that marks methods as UI components and enables automatic
  *   source path attachment when used with the .withSourcePath extension method
  *
  * Usage:
  * ```scala
  * import www.locator.UIComponentSource.withSourcePath
  *
  * @component
  * def myButton(): HtmlElement = {
  *   button("Click me").withSourcePath
  * }
  * ```
  *
  * This will automatically attach source path information for development
  * tooling, making the element discoverable by the locator system (Alt+hover to
  * see source path).
  */
class component extends StaticAnnotation

/** Companion object providing automatic source path attachment functionality
  */
object UIComponentSource {

  // HTML properties for source path information (same as Locator)
  private lazy val scalaSourcePath =
    htmlProp("__scalasourcepath", StringAsIsCodec)

  private lazy val scalaFileName =
    htmlProp("__scalafilename", StringAsIsCodec)

  private lazy val scalaLineNumber =
    htmlProp("__scalasourceline", IntAsStringCodec)

  /** Extension method that automatically attaches source path information
    * Import this to enable .withSourcePath on HtmlElement
    */
  extension (element: HtmlElement) {
    inline def withSourcePath: HtmlElement = {
      val fileName = sourcecode.FileName()
      val file = sourcecode.File()
      val line = sourcecode.Line()

      element.amend(scalaFileName := fileName)
      if (developmentMode) {
        element.amend(
          scalaSourcePath := file,
          scalaLineNumber := line,
          dataAttr("source-path") := s"${fileName}:${line}"
        )
      }
      element
    }
  }
}
