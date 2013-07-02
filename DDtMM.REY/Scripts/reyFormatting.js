var reyFormatting = (function ($) {

    // takes regex tokens, and breaks them down into formatted tokens
    function formatRegexTokens(tokens) {
        if (!tokens || !tokens.length) return [];

        var formattedTokens = [];
        var subTokenizedToken;
        var token;
       

        for (var i = 0, il = tokens.length; i < il; i++) {
            token = tokens[i];

            switch (token.rule.namespace) {
                case 'Ignored':
                    token.text = token.text.replace('\n', '');
                    break;
                case 'Literal':
                    // replace break character
                    token.text = token.text.replace('\n', '\u00B6');
                    break;
            }

            // does this rule have have pertanent data with.
            if (token.rule.capturedCount == 0) {
                formattedTokens.push({
                    value: token.text,
                    type: token.rule.namespace.replace('.', '_'),
                    parserToken: token
                });
            } else {
                subTokenizedToken = tokenizeParameterizedToken(token);
                for (var j = 0, jl = subTokenizedToken.length; j < jl; j++) {
                    formattedTokens.push({
                        value: subTokenizedToken[j].text,
                        type: token.rule.namespace.replace('.', '_') + subTokenizedToken[j].index,
                        parserToken: token
                    });
                }
            }
        }

        return  formattedTokens;
    }

    // breaks down token that captures data inside
    function tokenizeParameterizedToken(token) {
        var results = [],
            match = token.text.match(new RegExp(token.rule.regEx)),
            root = match[0],
            groupIndex,
            lastEndIndex = 0,
            capture;

        for (var i = 1, il = match.length; i < il; i++) {
            capture = match[i];
            groupIndex = root.indexOf(capture, lastEndIndex);

            // readd parts of the root
            if (groupIndex > lastEndIndex) {
                results.push({ text: root.substr(lastEndIndex, groupIndex - lastEndIndex), index: '' })
            }
            results.push({ text: capture, index: '-' + i });
            lastEndIndex = groupIndex + capture.length;
        }

        if (root.length > lastEndIndex) results.push({ text: root.substr(lastEndIndex), index: '' });

        return results;
    }

    var my = {
        formatRegexTokens: formatRegexTokens
    };

    return my;
}(jQuery));