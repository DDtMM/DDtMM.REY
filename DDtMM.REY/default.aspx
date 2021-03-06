﻿<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="default.aspx.cs" Inherits="DDtMM.REY._default" %>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>REY, a Regular Expression Editor</title>
    <%: Styles.Render("~/Content/bundle") %>
    <%: Styles.Render("~/Content/jquery-ui-theme/bundle") %>
</head>
<body>
<header>
    <div class="logoMenu" >
        <div id="saveSessionMenu" class="menu">
            <div id="saveSessionButton" class="menuLabel iconButton" >Save</div>
            <ul id="saveSessionItemPanel" class="menuItemsPanel" >
                <li id="updateSession" class="disabled" >Update</li>
                <li id="saveNewSession" >Save New</li>
                <li id="gotoSessionUrl" style="display:none"></li>
            </ul>
        </div>
        <div class="iconButton" id="helpButton" style="vertical-align:top" >Help</div>
    </div>
    <span style="font-size:.625em; font-style:italic; float:right">(v<%=Global.Version%>)</span>
</header>
<div id="RegexEditor" class="fillHeight">
<div id="inputPanel" class="panel">
    <div id="patternPanel" class="panel">
        <div class="panelTitle">
            <span class="titleText" id="regularExpressionLabel">Regular Expression</span>
            <div id="regexOptionsMenu" class="menu">
                <div id="regexOptionsButton" class="menuLabel iconButton" ></div>
                <ul id="regexOptionsItemPanel" class="menuItemsPanel" >
                    <li>
                        <input type="checkbox" id="opt-reg-global" value="g" checked="checked" />
                        <label for="opt-reg-global">Global (g)</label>
                    </li>
                    <li>
                        <input type="checkbox" id="opt-reg-insensitive" value="i" />
                        <label for="opt-reg-insensitive">Case Insensitve (i)</label>
                    </li>
                    <li>
                        <input type="checkbox" id="opt-reg-multiline" value="m" />
                        <label for="opt-reg-multiline">Multiline (m)</label>
                    </li>
                    <li>
                        <input type="checkbox" id="opt-xregex-dotall" value="s" />
                        <label for="opt-xregex-dotall">. all (s)</label>
                    </li>
                    <li>
                        <input type="checkbox" id="opt-xregex-extended" value="x" />
                        <label for="opt-xregex-extended">Extended (x)</label>
                    </li>
                    <li>
                        <input type="checkbox" id="opt-xregex-explicitcapture" value="n" />
                        <label for="opt-xregex-explicitcapture">Explicit Capture (n)</label>
                    </li>
                </ul>
            </div>
            
        </div>
        <div id="patternEditor" class="fillHeight"></div>
        <div id="patternEditorMessage" class="moduleMessage">&nbsp;</div>
 
    </div>
    <div class="dg-splitter dg-splitter-v" >&nbsp;</div>
    <div id="targetPanel" class="panel">
        <div>
            <div class="panelTitle">
                <span class="titleText">Source Text</span>
                <div class="iconButton" id="loadUrlButton">Import Url</div>
                <div class="iconButton" id="loadFileButton">Import File</div>
                <input type="file" id="importFile" /></div>
            </div>
        <div id="targetEditor" class="fillHeight"></div>

    </div>
</div>
<div class="dg-splitter dg-splitter-h">&nbsp;</div>
<div id="rightPanel" class="panel">
    <div class="panelTitle">
        <span class="titleText" id="moduleName"></span>
        <div id="changeModuleMenu" class="menu">
        
            <div id="changeModuleButton" class="menuLabel iconButton">Tools</div>
            <ul id="changeModuleItemPanel" class="menuItemsPanel" > </ul>
 
        </div>
    </div>
    <div id="moduleContainer" class="fillHeight"></div>
</div>
<div id="docs" title="REY Help">
    <div id="intro" title="Introduction">
        <h1>Introduction</h1>
        <p>REY (Regular Expressions? Yippee!) is a regular expression editor that allows you to comprehensively 
            evaluate any regular expression pattern using a variety of convienent tools.  To do this, all you need 
            to do is enter a regular expression and some text to test against, and immediately (okay a second later) 
            you'll be able to visualize successful matches within your text, see the results of splitting the text
            into an array, replace matched text with a string or function, and much, much, more
            <sup><a href="#introfn1">1</a></sup>. 
        </p>

        <p>REY was created by <a href="http://daniel.gimenez.biz">Daniel Gimenez</a> &copy; 2013.  
            It uses your browser's JavaScript RegExp object with extended functionality provided 
            by <a href="http://xregexp.com/">XRegExp</a>.
        </p>
        <p>
            If you have a question, found a bug, or have a feature request.  Feel free to email 
            me at <a href="mailto:reyRegEx@gimenez.biz">reyRegEx@gimenez.biz</a>
        </p>
        
        <span class="seeAlso">See Also:</span>
        <ul>
            <li><a href="#!tools"></a></li>
            <li><a href="#!regexpmodifiers"></a></li>
        </ul>

        <br />

        <sup id="introfn1" class="footnote" >1. much, much, more coming soon.</sup>
    </div>
    <div id="regexpmodifiers" title="Regular Expression Modifiers">
        <h1>Regular Expression Modifiers</h1>
        <p>
            The behavior of your regular expression can be modified by changing the engine modifiers 
            above the expression editor.  These modifiers are standard to most regular expression engines,
            but you can use the Current Syntax Tool to view and syntatical differences from the flavor
            of regular expressions you're used to as well as the differences created when a modifier is 
            added or removed.
        </p>

        <h2>Global (g)</h2>
        <p>When checked, all matches are found.  Otherwise only the first match will be shown.</p>
        <h2>Case Insensitve (i)</h2>
        <p>Performs a case insensitve search, so that a simple expression such a <em>FIND ME</em> would
            match characters in a string such as <em>find me</em>, <em>Find Me</em>, and <em>fInD mE</em>.
        </p>
        <h2>Multiline (m)</h2>
        <p>When checked, <em>^</em> and <em>$</em> match line starts and line ends respectively, instead of just the
            start and end of the entire string.
        </p>
        <h2>. all (s)</h2>
        <p>When checked, the <em>.</em> class will match any character, otherwise it will not match new lines.</p>
        <h2>Extended (x)</h2>
        <p>Allows for freespacing (whitespaces are ignored) and line comments.</p>
        <h2>Explicit Capture (n)</h2>
        <p>Only named capture groups are captured when this is enabled.</p>
        <span class="seeAlso">See Also:</span>
        <ul>
            <li><a href="http://xregexp.com/">XRegExp project website</a></li>
        </ul>
    </div>
    <div id="saving" title="Saving your Work">
        <h1>Saving your Work</h1>
        <p>Clicking the <b>Save</b> button over the Regular Expression will bring down a menu that
            will allow you to a save a new copy of your current session or update the existing session.
        </p>
        <p>When you save a new session, a permalink will be returned that you can use to access your
            work later.  If you make changes, but don't want to save a new item, you can click Update.
        </p>
        <p>For now, you will only be able to update a link on the computer you initialy created it on.
        </p>
    </div>
    <div id="tools" title="Tools">
        <h1>Tools</h1>
        <p>Currently there are five tools available on the right panel of the application, but there is certainly
            room for more.
        </p>
        <h2>Current Syntax</h2>
        <p>Displays the entities available for a regular expression, given the currently selected modifiers.
            Entities the may not be available with other options are highlighted in yellow.
        </p>
        <h2>Find and Replace</h2>
        <p>Displays the results of replacing matched text with either plain text (that can include references
            to groups $1 to $9), or the results of a javascript function.  Use the following template to help 
            get you started using a function to replace text.
        </p>
        <code>
function viewCaptures () { 
    var result = '';
    for (var i = 0, il = arguments.length - 2; i &lt; il; i++) {
        result += i.toString() + ': ' + arguments[i] + '\n';	
    }
    return result;
}
        </code>
        <h2>History</h2>
        <p>Displays up to 50 of your last edits to your regular expression.</p>
        <h2>Match Visualizer</h2>
        <p>Shows where matches occur in a document and breaks the matches down into their respective groups.</p>
        <h2>String Split</h2>
        <p>Breaks the text up into an array, using the matched text as a delimiter.  In JavaScript any
            text matched in a group is included in the array.
        </p>
        <h2>Performance</h2>
        <p>Runs a performance test of your regular expression against the current text.
        </p>
    </div>
    <div id="performance" title="Performance" data-parent="tools">
        <h1>Performance Tool</h1>
        <p>The Performance Tool runs a test of your regular expression's performance against
            your current target text.
        </p>
        <p>Each time you run a test, the result is added to a list of results so that you can 
            evaluate how your changes effect performance.  The higer the number, the better
            the performance of the regular expression.
        </p>
    </div>
    <div id="querystring" title="Querystring Parameters">
        <h1>Querystring Parameters</h1>
        <p>You can put querystring parameters into the url.  This is somewhat redundant with regards to
            saving, but will be 100% permanent whereas saving has a time limitation.
        </p>

        <table class="definitions">
            <tr>
                <td>re</td><td>The Regular Expression to edit.</td>
            </tr>
            <tr>
                <td>txt</td><td>The text to test the expression on.</td>
            </tr>
            <tr>
                <td>url</td><td>A url to load the text to test the expression on.</td>
            </tr>
            <tr>
                <td>tool</td><td>The default tool to load.  The possible values
                    are currently: <i>reyCurrentSyntax, findAndReplace, mapVisualizer, reyStringSplit</i>.
                    This will change in the future to something shorter.
                </td>
            </tr>
            <tr>
                <td>options</td><td>A string with the regular expression modifiers.  For example
                    gi would result in the options global and case insensitve being used.
                </td>
            </tr>
            <tr>
                <td>prm.****</td>
                <td>This is an optional tool parameter.  Only applies to current tool. 
                    Currently only supported by Find and Replace.  
                    <ul>
                        <li>prm.function: replace function</li>
                        <li>prm.text: replace text</li>
                        <li>prm.mode: function or text</li>
                    </ul>
                </td>
            </tr>
        </table>
    </div>
    <div id="roadmap" title="Road Map">
        <h1>REY Road Map</h1>
        <p>
            What's coming up:
        </p>
        <h2>Authentication</h2>
        <p>
            I'm going to get around to adding oauth athentication so that I can expand the saving functionality, and then add some community features.
        </p>
        <h2>Saving Sessions</h2>
        <p>
            Saving Sessions is well on its way.  I've moved over to a hosted mongodb instance on
            <a href="http://mongolab.com">mongolab.com</a>.
        </p>
        <p>    
            Eventually want to add the ability to save history and allow for versions like jsFiddle.  
        </p>
        <h2>More Regex engines</h2>
        <p>
            This is far into the future, but I want to add server side regular expression functionality.
            I really only have to override one module to make this possible in its most basic form, but then
            things like syntax and group parsing have to be updated for each supported engine as well.
        </p>
        <h2>Tool Updates</h2>
        <ul>
            <li>Match Visualizer: Highlight the group in the regex text when hovering over a match. </li>
            <li>Match Visualizer: Hide line numbers on formatted text tab. </li>
        </ul>
        <h2>New Tools</h2>
        <ul>
            <li>Regular Expression Visualizer: There are some awesome tools that diagram regular expressions.
                I want to do something better.
            </li>
            <li>Unicode Escaper: Converts Unicode text to regex escape charaters.
            </li>
        </ul>
        <h2>Misc</h2>
        <ul>
            <li>Clean up code -- I'm slowly sinking into speghetti world...
            </li>
        </ul>
    </div>
    <div id="acknowledgements" title="Acknowledgements">
        <h1>Acknowledgements</h1>
        <p>It fills me with awe whenever I realize that any program I create is built upon a foundation of
            a seemingly infinite array of projects, applications, and frameworks.  REY would not have 
            been possible without, and in the very least, the following projects/sites/applications.
        </p>
        <h2>Open Source Projects</h2>
        <h3><a href="http://xregexp.com/">XRegExp</a></h3>
        <p>XRegExp extends JavaScript's native RegExp object to add a lot of useful features and fix some 
            cross-browser issues.  You can safely use it in place of RegExp without an icompatibility issues.</p>
        <h3><a href="http://ace.ajax.org/">Ace Code editor</a></h3>
        <p>The Ace Code Editor is the editor used throughout all the application.  Definitely the best 
            browser based code editor.
        </p>
        <h3><a href="http://jquery.com/">jQuery</a> and <a href="http://jqueryui.com/">jQuery UI</a></h3>
        <p>JavaScript would be such a pain without jQuery.</p>
        <h3><a href="http://www.mongodb.org/">Mongodb</a></h3>
        <p>
            I started using Mongodb for the file saving.  I love how easy it is to use.
        </p>
        <h3><a href="http://modernizr.com/">Modernizr</a></h3>
        <p>One day we will live in a word without cross-browser compatibility issues.  
            Until that day there is Modernizr.</p>
        <h2>Reference Sites</h2>
        <h3><a href="http://www.regular-expressions.info/">regular-expressions.info/</a></h3>
        <p>I've been using this website forever.  Everything you need to know about Regular Expressions you can find here.</p>
        <h3><a href="http://www.stackoverflow.com/">Stack Overflow</a></h3>
        <p>I've recently become addicted to this site, and it is my go to for answers.</p>
        <h3><a href="http://developer.mozilla.org">Mozilla Developer Network</a></h3>
        <p>... and this comes up second or third.  Plus it was a little more clear about Regular Expressions in JavaScript.</p>
        <h3><a href="http://www.html5rocks.com/">HTML5 ROCKS</a></h3>
        <p>I didn't know LocalStorage existed, or that you could upload files without a server.  Thanks HTML5 ROCKS!</p>
        <h2>Other Regular Expression Editors</h2>
        <p>Imitation is the sincereness form of flattery.  I hope the makers of these programs agree.</p>
        <h3><a href="http://www.gskinner.com/RegExr/">gskinner's RegExr</a></h3>
        <p>Probably the best online regular expression editing tool.  Made in Flash.</p>
        <h3>... that other one...</h3>
        <p>There was another one where I got the idea to upload files and import urls from.  
            I apologize to the author for forgetting.</p>
        <h2>Hosting providers</h2>
        <h3><a href="http://www.mongolab.com">Mongo Lab</a></h3>
        <p>Mongolab provides free mongodb hosting.</p>
    </div>
</div>
</div>
<div id="loader">
    <img src="/images/loader3.gif" />
    <div id="loading-message">LOADING</div>
</div>
        <%: Scripts.Render("~/Scripts/bundle") %>
        <%: Scripts.Render("~/Scripts/ace/bundle") %>

</body>
</html>
