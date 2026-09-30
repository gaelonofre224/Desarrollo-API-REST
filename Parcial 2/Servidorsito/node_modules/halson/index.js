(function(module, win) {
    var escapeRegExp = typeof RegExp.escape === 'function'
        ? RegExp.escape
        : function(s) { return s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&'); };

    function HALSONResource(data) {
        data = data || {};

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        for (var attr in data) {
            if (!(attr in this) && data.hasOwnProperty(attr)) {
                this[attr] = data[attr];
            }
        }

        if (this._embedded && (typeof this._embedded === 'object')) {
            var _embedded = {};
            var self = this;
            Object.keys(this._embedded).forEach(function(key) {
                if (self._embedded.hasOwnProperty(key)) {
                  if (Array.isArray(self._embedded[key])) {
                    _embedded[key] = [].concat(self._embedded[key]).map(function(embed) {
                        return createHALSONResource(embed);
                    });
                  } else {
                    _embedded[key] = createHALSONResource(self._embedded[key]);
                  }
                }
            });

            this._embedded = _embedded;
        }

    }

    HALSONResource.prototype.className = 'HALSONResource';

    HALSONResource.prototype._invert = function(filterCallback) {
        return function() {
            return !filterCallback.apply(null, arguments);
        };
    };

    HALSONResource.prototype.listLinkRels = function() {
        return this._links ? Object.keys(this._links) : [];
    };

    HALSONResource.prototype.listEmbedRels = function() {
        return this._embedded ? Object.keys(this._embedded) : [];
    };

    HALSONResource.prototype.getLinks = function(rel, filterCallback, begin, end) {
        if (!this._links || !(rel in this._links)) {
            return [];
        }

        var links = [].concat(this._links[rel]);

        if (filterCallback) {
            links = links.filter(filterCallback);
        }

        return links.slice(begin || 0, end || links.length);
    };

    HALSONResource.prototype.getLink = function(rel, filterCallback, def) {
        if (typeof filterCallback !== 'function') {
            def = filterCallback;
            filterCallback = null;
        }
        return this.getLinks(rel, filterCallback, 0, 1)[0] || def;
    };

    HALSONResource.prototype.getEmbeds = function(rel, filterCallback, begin, end) {
        if (!this._embedded || !(rel in this._embedded)) {
            return [];
        }

        var items = [].concat(this._embedded[rel]);

        if (filterCallback) {
            items = items.filter(filterCallback);
        }

        return items.slice(begin || 0, end || items.length);
    };

    HALSONResource.prototype.getEmbed = function(rel, filterCallback, def) {
        if (typeof filterCallback !== 'function') {
            def = filterCallback;
            filterCallback = null;
        }
        return this.getEmbeds(rel, filterCallback, 0, 1)[0] || def;
    };

    HALSONResource.prototype.addLink = function(rel, link) {
        if (typeof link === 'string') {
            link = {href: link};
        }

        if (!this._links) {
            this._links = {};
        }

        if (!(rel in this._links)) {
            // single link
            this._links[rel] = link;
        } else {
            // multiple links
            this._links[rel] = [].concat(this._links[rel]);
            this._links[rel].push(link);
        }

        return this;
    };

    HALSONResource.prototype.addEmbed = function(rel, embed) {
        return this.insertEmbed(rel, -1, embed);
    };

    HALSONResource.prototype.insertEmbed = function(rel, index, embed) {
        if (!this._embedded) {
            this._embedded = {};
        }

        if (!(rel in this._embedded)) {
            this._embedded[rel] = Array.isArray(embed) ? embed.map(createHALSONResource) : createHALSONResource(embed);
            return this;
        }

        var items = [].concat(embed).map(createHALSONResource);

        this._embedded[rel] = [].concat(this._embedded[rel]);

        if (index < 0) {
            Array.prototype.push.apply(this._embedded[rel], items);
        } else {
            var params = [index, 0].concat(items);
            Array.prototype.splice.apply(this._embedded[rel], params);
        }

        return this;
    };

    HALSONResource.prototype.removeLinks = function(rel, filterCallback) {
        if (!this._links || !(rel in this._links)) {
            return;
        }

        if (!filterCallback) {
            delete(this._links[rel]);
        } else {
            this._links[rel] = [].concat(this._links[rel]).filter(this._invert(filterCallback));
        }

        return this;
    };

    HALSONResource.prototype.removeEmbeds = function(rel, filterCallback) {
        if (!this._embedded || !(rel in this._embedded)) {
            return;
        }

        if (!filterCallback) {
            return delete(this._embedded[rel]);
        }

        this._embedded[rel] = [].concat(this._embedded[rel]).filter(this._invert(filterCallback));

        return this;
    };

    HALSONResource.prototype.hasLink = function(rel) {
        return !!(this._links && (rel in this._links));
    };

    HALSONResource.prototype.getHref = function(rel, filterCallback) {
        var link = this.getLink(rel, filterCallback);
        return link ? link.href : undefined;
    };

    HALSONResource.prototype.hasAnyLink = function(rels) {
        if (!Array.isArray(rels)) {
            return false;
        }
        var self = this;
        return rels.some(function(rel) {
            return self.hasLink(rel);
        });
    };

    HALSONResource.prototype.addTemplate = function(rel, template) {
        return this.addLink(rel, {
            href: template,
            templated: true
        });
    };

    HALSONResource.prototype.isTemplated = function(rel) {
        var link = this.getLink(rel);
        return !!(link && link.templated === true);
    };

    HALSONResource.prototype.getTemplateVariables = function(rel) {
        var link = this.getLink(rel);
        if (!link || !link.templated) {
            return [];
        }
        
        // Simple RFC 6570 variable extraction
        var matches = link.href.match(/\{([^}]+)\}/g) || [];
        var variables = [];
        
        matches.forEach(function(match) {
            var content = match.slice(1, -1); // Remove { }
            // Handle query parameters {?var1,var2}
            if (content.indexOf('?') === 0) {
                content = content.slice(1); // Remove ?
            }
            // Split by comma for multiple variables
            var vars = content.split(',');
            vars.forEach(function(v) {
                var cleaned = v.trim().replace(/[+#./;]/, '');
                if (cleaned && variables.indexOf(cleaned) === -1) {
                    variables.push(cleaned);
                }
            });
        });
        
        return variables;
    };

    HALSONResource.prototype.expandTemplate = function(rel, variables) {
        var link = this.getLink(rel);
        if (!link || !link.templated) {
            return link ? link.href : undefined;
        }
        
        variables = variables || {};
        var expanded = link.href;
        
        // Simple RFC 6570 Level 1 expansion
        Object.keys(variables).forEach(function(key) {
            var value = encodeURIComponent(variables[key]);
            var escapedKey = escapeRegExp(key);
            var encodedKey = encodeURIComponent(key);
            expanded = expanded.replace(new RegExp('\\{' + escapedKey + '\\}', 'g'), value);
            expanded = expanded.replace(new RegExp('\\{\\?' + escapedKey + '(,[^}]*)?\\}', 'g'), '?' + encodedKey + '=' + value);
            expanded = expanded.replace(new RegExp('\\{([^}]*,)?' + escapedKey + '(,[^}]*)?\\}', 'g'), encodedKey + '=' + value);
        });
        
        // Remove unused template variables
        expanded = expanded.replace(/\{[^}]*\}/g, '');
        
        return expanded;
    };

    HALSONResource.prototype.addCurie = function(name, href, templated) {
        if (!this._links) {
            this._links = {};
        }
        
        var curie = {
            name: name,
            href: href,
            templated: templated !== false
        };
        
        if (!this._links.curies) {
            this._links.curies = [];
        } else {
            this._links.curies = [].concat(this._links.curies);
        }
        
        this._links.curies.push(curie);
        return this;
    };

    HALSONResource.prototype.expandCurie = function(rel) {
        if (!rel || rel.indexOf(':') === -1) {
            return rel;
        }
        
        var parts = rel.split(':');
        var prefix = parts[0];
        var suffix = parts[1];
        
        if (!this._links || !this._links.curies) {
            return rel;
        }
        
        var curies = [].concat(this._links.curies);
        var curie = null;
        for (var i = 0; i < curies.length; i++) {
            if (curies[i].name === prefix) {
                curie = curies[i];
                break;
            }
        }
        
        if (!curie) {
            return rel;
        }
        
        return curie.href.replace('{rel}', suffix);
    };

    HALSONResource.prototype.hasCurie = function(name) {
        if (!this._links || !this._links.curies) {
            return false;
        }
        
        var curies = [].concat(this._links.curies);
        return curies.some(function(c) {
            return c.name === name;
        });
    };

    HALSONResource.prototype.validate = function(options) {
        options = options || {};
        var errors = [];
        var warnings = [];
        
        var strict = options.strict === true;
        var requireLinks = options.requireLinks || [];
        var allowMissingLinks = options.allowMissingLinks || [];
        var allowMissingEmbeds = options.allowMissingEmbeds || [];
        
        var self = this;
        
        // Check required links
        requireLinks.forEach(function(rel) {
            if (!self.hasLink(rel)) {
                if (allowMissingLinks.indexOf(rel) === -1) {
                    errors.push('Missing required link: ' + rel);
                } else {
                    warnings.push('Missing optional link: ' + rel);
                }
            }
        });
        
        // Check for self link (HAL best practice)
        if (!this.hasLink('self') && strict) {
            if (requireLinks.indexOf('self') === -1) {
                warnings.push('Missing self link (HAL best practice)');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    };

    HALSONResource.prototype.accepts = function(mediaType) {
        // Simple implementation - in real scenario would check Accept headers
        var supportedTypes = [
            'application/hal+json',
            'application/json',
            'application/vnd.api+json'
        ];
        return supportedTypes.indexOf(mediaType) !== -1;
    };

    HALSONResource.prototype.asJson = function() {
        var result = {};
        var self = this;
        
        // Copy all non-HAL properties
        Object.keys(this).forEach(function(key) {
            if (key !== '_links' && key !== '_embedded' && key !== 'className') {
                result[key] = self[key];
            }
        });
        
        return result;
    };

    HALSONResource.prototype.asHal = function() {
        return JSON.parse(JSON.stringify(this));
    };

    HALSONResource.prototype.getContentType = function() {
        return 'application/hal+json';
    };

    HALSONResource.prototype.follow = function(rel, options) {
        var link = this.getLink(rel);
        if (!link) {
            return Promise.reject(new Error('Link not found: ' + rel));
        }
        
        options = options || {};
        var fetchImpl = options.fetch || (typeof fetch !== 'undefined' ? fetch : null);
        
        if (!fetchImpl) {
            return Promise.reject(new Error('No fetch implementation available'));
        }
        
        return fetchImpl(link.href, {
            method: link.method || 'GET',
            headers: {
                'Accept': 'application/hal+json',
                'Content-Type': link.type || 'application/json'
            }
        }).then(function(response) {
            return response.json();
        }).then(function(data) {
            return createHALSONResource(data);
        });
    };

    HALSONResource.prototype.followAll = function(rel, options) {
        var links = this.getLinks(rel);
        if (links.length === 0) {
            return Promise.resolve([]);
        }
        
        var self = this;
        var promises = links.map(function(link) {
            // Create temporary resource to follow individual link
            var tempResource = createHALSONResource({});
            tempResource.addLink(rel, link);
            return tempResource.follow(rel, options);
        });
        
        return Promise.all(promises);
    };

    HALSONResource.prototype.resolve = function(rel, variables) {
        var link = this.getLink(rel);
        if (!link) {
            return undefined;
        }
        
        if (link.templated && variables) {
            return this.expandTemplate(rel, variables);
        }
        
        return link.href;
    };

    function createHALSONResource(data) {
        if (data && (data.className === HALSONResource.prototype.className)) {
            return data;
        }
        return new HALSONResource(data);
    }

    // IANA Link Relations Constants
    var IanaRels = {
        ABOUT: 'about',
        ALTERNATE: 'alternate',
        APPENDIX: 'appendix',
        ARCHIVES: 'archives',
        AUTHOR: 'author',
        BOOKMARK: 'bookmark',
        CANONICAL: 'canonical',
        CHAPTER: 'chapter',
        COLLECTION: 'collection',
        CONTENTS: 'contents',
        COPYRIGHT: 'copyright',
        CREATE_FORM: 'create-form',
        CURRENT: 'current',
        DESCRIBEDBY: 'describedby',
        DESCRIBES: 'describes',
        DISCLOSURE: 'disclosure',
        DUPLICATE: 'duplicate',
        EDIT: 'edit',
        EDIT_FORM: 'edit-form',
        EDIT_MEDIA: 'edit-media',
        ENCLOSURE: 'enclosure',
        FIRST: 'first',
        GLOSSARY: 'glossary',
        HELP: 'help',
        HOSTS: 'hosts',
        HUB: 'hub',
        ICON: 'icon',
        INDEX: 'index',
        ITEM: 'item',
        LAST: 'last',
        LATEST_VERSION: 'latest-version',
        LICENSE: 'license',
        LRDD: 'lrdd',
        MEMENTO: 'memento',
        MONITOR: 'monitor',
        MONITOR_GROUP: 'monitor-group',
        NEXT: 'next',
        NEXT_ARCHIVE: 'next-archive',
        NOFOLLOW: 'nofollow',
        NOREFERRER: 'noreferrer',
        ORIGINAL: 'original',
        PAYMENT: 'payment',
        PREDECESSOR_VERSION: 'predecessor-version',
        PREFETCH: 'prefetch',
        PREV: 'prev',
        PREVIEW: 'preview',
        PREVIOUS: 'previous',
        PREV_ARCHIVE: 'prev-archive',
        PRIVACY_POLICY: 'privacy-policy',
        PROFILE: 'profile',
        RELATED: 'related',
        REPLIES: 'replies',
        SEARCH: 'search',
        SECTION: 'section',
        SELF: 'self',
        SERVICE: 'service',
        START: 'start',
        STYLESHEET: 'stylesheet',
        SUBSECTION: 'subsection',
        SUCCESSOR_VERSION: 'successor-version',
        TAG: 'tag',
        TERMS_OF_SERVICE: 'terms-of-service',
        TIMEGATE: 'timegate',
        TIMEMAP: 'timemap',
        TYPE: 'type',
        UP: 'up',
        VERSION_HISTORY: 'version-history',
        VIA: 'via',
        WORKING_COPY: 'working-copy',
        WORKING_COPY_OF: 'working-copy-of',
        DELETE: 'delete'
    };

    function HALResourceBuilder(data) {
        this._resource = createHALSONResource(data || {});
    }

    HALResourceBuilder.prototype.link = function(rel, linkOrHref) {
        this._resource.addLink(rel, linkOrHref);
        return this;
    };

    HALResourceBuilder.prototype.template = function(rel, template) {
        this._resource.addTemplate(rel, template);
        return this;
    };

    HALResourceBuilder.prototype.embed = function(rel, resource) {
        this._resource.addEmbed(rel, resource);
        return this;
    };

    HALResourceBuilder.prototype.curie = function(name, href, templated) {
        this._resource.addCurie(name, href, templated);
        return this;
    };

    HALResourceBuilder.prototype.build = function() {
        return this._resource;
    };

    function createPagedResource(data, pageMetadata) {
        var resource = createHALSONResource(data);
        
        resource.page = pageMetadata || {
            number: 0,
            size: 20,
            totalElements: 0,
            totalPages: 0
        };
        
        resource.hasNext = function() {
            return this.page.number < (this.page.totalPages - 1);
        };
        
        resource.hasPrev = function() {
            return this.page.number > 0;
        };
        
        resource.next = function() {
            if (!this.hasNext()) return null;
            return this.getHref('next');
        };
        
        resource.prev = function() {
            if (!this.hasPrev()) return null;
            return this.getHref('prev');
        };
        
        resource.first = function() {
            return this.getHref('first');
        };
        
        resource.last = function() {
            return this.getHref('last');
        };
        
        return resource;
    }

    createHALSONResource.Resource = HALSONResource;
    createHALSONResource.IanaRels = IanaRels;
    createHALSONResource.HALResourceBuilder = function(data) {
        return new HALResourceBuilder(data);
    };
    createHALSONResource.createPagedResource = createPagedResource;

    if (module) {
        module.exports = createHALSONResource;
    } else if (win) {
        win.halson = createHALSONResource;
    }
})(typeof(module) === 'undefined' ? null : module, typeof(window) === 'undefined' ? null : window);
