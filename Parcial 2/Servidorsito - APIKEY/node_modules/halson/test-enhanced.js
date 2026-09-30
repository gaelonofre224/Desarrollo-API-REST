var assert = require('assert');
var expect = require('chai').expect;
var halson = require('./index');

function clone(data) {
    return JSON.parse(JSON.stringify(data));
}

describe('halson enhanced features', function() {
    describe('IanaRels', function() {
        it('expose standard relation types', function() {
            expect(halson.IanaRels).to.be.an('object');
            assert.strictEqual(halson.IanaRels.SELF, 'self');
            assert.strictEqual(halson.IanaRels.EDIT, 'edit');
            assert.strictEqual(halson.IanaRels.DELETE, 'delete');
            assert.strictEqual(halson.IanaRels.NEXT, 'next');
            assert.strictEqual(halson.IanaRels.PREV, 'prev');
            assert.strictEqual(halson.IanaRels.PREVIOUS, 'previous');
            assert.strictEqual(halson.IanaRels.FIRST, 'first');
            assert.strictEqual(halson.IanaRels.LAST, 'last');
            assert.strictEqual(halson.IanaRels.RELATED, 'related');
            assert.strictEqual(halson.IanaRels.COLLECTION, 'collection');
            assert.strictEqual(halson.IanaRels.ITEM, 'item');
            assert.strictEqual(halson.IanaRels.UP, 'up');
            assert.strictEqual(halson.IanaRels.SEARCH, 'search');
        });

        it('work as rel arguments to addLink/getLink', function() {
            var res = halson();
            res.addLink(halson.IanaRels.SELF, '/test');
            assert.strictEqual(res.getLink('self').href, '/test');
        });
    });

    describe('hasLink()', function() {
        it('return false on empty resource', function() {
            assert.strictEqual(halson().hasLink('self'), false);
        });

        it('return false for missing rel', function() {
            var res = halson().addLink('self', '/test');
            assert.strictEqual(res.hasLink('edit'), false);
        });

        it('return true for existing rel', function() {
            var res = halson().addLink('self', '/test');
            assert.strictEqual(res.hasLink('self'), true);
        });

        it('return true for rel with multiple links', function() {
            var res = halson()
                .addLink('related', '/a')
                .addLink('related', '/b');
            assert.strictEqual(res.hasLink('related'), true);
        });
    });

    describe('getHref()', function() {
        it('return undefined on empty resource', function() {
            assert.strictEqual(halson().getHref('self'), undefined);
        });

        it('return undefined for missing rel', function() {
            var res = halson().addLink('self', '/test');
            assert.strictEqual(res.getHref('edit'), undefined);
        });

        it('return href string for existing link', function() {
            var res = halson()
                .addLink('self', '/users/1')
                .addLink('edit', {href: '/users/1/edit', method: 'PUT'});
            assert.strictEqual(res.getHref('self'), '/users/1');
            assert.strictEqual(res.getHref('edit'), '/users/1/edit');
        });

        it('return first href when rel has multiple links', function() {
            var res = halson()
                .addLink('related', '/a')
                .addLink('related', '/b');
            assert.strictEqual(res.getHref('related'), '/a');
        });
    });

    describe('hasAnyLink()', function() {
        it('return false for empty array', function() {
            var res = halson().addLink('self', '/test');
            assert.strictEqual(res.hasAnyLink([]), false);
        });

        it('return false when none match', function() {
            var res = halson().addLink('self', '/test');
            assert.strictEqual(res.hasAnyLink(['edit', 'delete']), false);
        });

        it('return true when at least one matches', function() {
            var res = halson()
                .addLink('self', '/test')
                .addLink('edit', '/test/edit');
            assert.strictEqual(res.hasAnyLink(['delete', 'edit']), true);
        });

        it('return false for non-array input', function() {
            var res = halson().addLink('self', '/test');
            assert.strictEqual(res.hasAnyLink('self'), false);
            assert.strictEqual(res.hasAnyLink(null), false);
        });
    });

    describe('addTemplate()', function() {
        it('create a templated link', function() {
            var res = halson();
            res.addTemplate('search', '/users{?name,status}');

            var link = res.getLink('search');
            assert.strictEqual(link.href, '/users{?name,status}');
            assert.strictEqual(link.templated, true);
        });

        it('return this for chaining', function() {
            var res = halson();
            assert.strictEqual(res.addTemplate('search', '/search{?q}'), res);
        });
    });

    describe('isTemplated()', function() {
        it('return false for non-templated link', function() {
            var res = halson().addLink('self', '/users/1');
            assert.strictEqual(res.isTemplated('self'), false);
        });

        it('return true for templated link', function() {
            var res = halson().addTemplate('search', '/users{?q}');
            assert.strictEqual(res.isTemplated('search'), true);
        });

        it('return false for missing rel', function() {
            assert.strictEqual(halson().isTemplated('missing'), false);
        });
    });

    describe('getTemplateVariables()', function() {
        it('return empty array for non-templated link', function() {
            var res = halson().addLink('self', '/users/1');
            assert.deepEqual(res.getTemplateVariables('self'), []);
        });

        it('return empty array for missing rel', function() {
            assert.deepEqual(halson().getTemplateVariables('missing'), []);
        });

        it('extract simple path variables', function() {
            var res = halson().addTemplate('user', '/users/{id}');
            var vars = res.getTemplateVariables('user');
            expect(vars).to.include('id');
        });

        it('extract query variables', function() {
            var res = halson().addTemplate('search', '/users{?name,email,status}');
            var vars = res.getTemplateVariables('search');
            expect(vars).to.include('name');
            expect(vars).to.include('email');
            expect(vars).to.include('status');
        });
    });

    describe('expandTemplate()', function() {
        it('expand simple path variable', function() {
            var res = halson().addTemplate('user', '/users/{id}');
            assert.strictEqual(res.expandTemplate('user', {id: '123'}), '/users/123');
        });

        it('expand query variables', function() {
            var res = halson().addTemplate('search', '/users{?name,status}');
            var expanded = res.expandTemplate('search', {name: 'John', status: 'active'});
            assert.strictEqual(expanded, '/users?name=John');
        });

        it('encode special characters', function() {
            var res = halson().addTemplate('search', '/search{?q}');
            var expanded = res.expandTemplate('search', {q: 'hello world'});
            assert.strictEqual(expanded, '/search?q=hello%20world');
        });

        it('return href as-is for non-templated link', function() {
            var res = halson().addLink('self', '/users/1');
            assert.strictEqual(res.expandTemplate('self'), '/users/1');
        });

        it('return undefined for missing rel', function() {
            assert.strictEqual(halson().expandTemplate('missing'), undefined);
        });

        it('escape regex-special characters in variable keys', function() {
            var res = halson().addTemplate('test', '/test/{a.b}');
            var expanded = res.expandTemplate('test', {'a.b': 'val'});
            assert.strictEqual(expanded, '/test/val');
        });

        it('do not match partial key via unescaped regex', function() {
            var res = halson().addTemplate('test', '/test/{a.b}/{axb}');
            // "a.b" unescaped would match "axb" too; with RegExp.escape it should not
            var expanded = res.expandTemplate('test', {'a.b': 'one'});
            assert.strictEqual(expanded, '/test/one/');
        });

        it('encode variable key in query output', function() {
            var res = halson().addTemplate('test', '/test{?a+b}');
            var expanded = res.expandTemplate('test', {'a+b': 'val'});
            assert.strictEqual(expanded, '/test?a%2Bb=val');
        });
    });

    describe('addCurie()', function() {
        it('add a curie link', function() {
            var res = halson();
            res.addCurie('acme', 'https://api.acme.com/rels/{rel}');

            expect(res._links.curies).to.be.an('array');
            assert.strictEqual(res._links.curies.length, 1);
            assert.strictEqual(res._links.curies[0].name, 'acme');
            assert.strictEqual(res._links.curies[0].href, 'https://api.acme.com/rels/{rel}');
            assert.strictEqual(res._links.curies[0].templated, true);
        });

        it('add multiple curies', function() {
            var res = halson()
                .addCurie('acme', 'https://api.acme.com/rels/{rel}')
                .addCurie('other', 'https://other.com/rels/{rel}');

            assert.strictEqual(res._links.curies.length, 2);
            assert.strictEqual(res._links.curies[0].name, 'acme');
            assert.strictEqual(res._links.curies[1].name, 'other');
        });

        it('return this for chaining', function() {
            var res = halson();
            assert.strictEqual(res.addCurie('acme', 'https://api.acme.com/{rel}'), res);
        });

        it('allow explicit templated=false', function() {
            var res = halson();
            res.addCurie('acme', 'https://api.acme.com/rels/fixed', false);
            assert.strictEqual(res._links.curies[0].templated, false);
        });
    });

    describe('hasCurie()', function() {
        it('return false on empty resource', function() {
            assert.strictEqual(halson().hasCurie('acme'), false);
        });

        it('return false for missing curie', function() {
            var res = halson().addCurie('acme', 'https://api.acme.com/{rel}');
            assert.strictEqual(res.hasCurie('other'), false);
        });

        it('return true for existing curie', function() {
            var res = halson().addCurie('acme', 'https://api.acme.com/{rel}');
            assert.strictEqual(res.hasCurie('acme'), true);
        });
    });

    describe('expandCurie()', function() {
        it('expand compact URI', function() {
            var res = halson().addCurie('acme', 'https://api.acme.com/rels/{rel}');
            assert.strictEqual(
                res.expandCurie('acme:orders'),
                'https://api.acme.com/rels/orders'
            );
        });

        it('return non-curie rel as-is', function() {
            var res = halson().addCurie('acme', 'https://api.acme.com/{rel}');
            assert.strictEqual(res.expandCurie('self'), 'self');
        });

        it('return unknown prefix as-is', function() {
            var res = halson().addCurie('acme', 'https://api.acme.com/{rel}');
            assert.strictEqual(res.expandCurie('other:thing'), 'other:thing');
        });

        it('return null/undefined as-is', function() {
            var res = halson();
            assert.strictEqual(res.expandCurie(null), null);
        });
    });

    describe('curie serialization', function() {
        it('preserve curies in JSON output', function() {
            var res = halson({id: 1});
            res.addCurie('acme', 'https://api.acme.com/rels/{rel}');
            res.addLink('acme:orders', '/users/1/orders');

            var json = JSON.parse(JSON.stringify(res));
            expect(json._links.curies).to.be.an('array');
            assert.strictEqual(json._links.curies[0].name, 'acme');
            expect(json._links['acme:orders']).to.exist;
        });
    });

    describe('validate()', function() {
        it('pass with no options', function() {
            var result = halson().validate();
            assert.strictEqual(result.valid, true);
            assert.deepEqual(result.errors, []);
            assert.deepEqual(result.warnings, []);
        });

        it('pass when required links are present', function() {
            var res = halson()
                .addLink('self', '/test')
                .addLink('edit', '/test/edit');

            var result = res.validate({requireLinks: ['self', 'edit']});
            assert.strictEqual(result.valid, true);
            assert.strictEqual(result.errors.length, 0);
        });

        it('fail when required links are missing', function() {
            var result = halson().validate({requireLinks: ['self', 'edit']});

            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.errors.length, 2);
            expect(result.errors[0]).to.include('self');
            expect(result.errors[1]).to.include('edit');
        });

        it('demote missing link to warning via allowMissingLinks', function() {
            var result = halson().validate({
                requireLinks: ['self', 'edit'],
                allowMissingLinks: ['edit']
            });

            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.errors.length, 1);
            assert.strictEqual(result.warnings.length, 1);
            expect(result.errors[0]).to.include('self');
            expect(result.warnings[0]).to.include('edit');
        });

        it('warn about missing self in strict mode', function() {
            var result = halson().validate({strict: true});

            assert.strictEqual(result.valid, true);
            assert.strictEqual(result.warnings.length, 1);
            expect(result.warnings[0]).to.include('self');
        });

        it('no self-link warning when self is present in strict mode', function() {
            var res = halson().addLink('self', '/test');
            var result = res.validate({strict: true});

            assert.strictEqual(result.valid, true);
            assert.strictEqual(result.warnings.length, 0);
        });

        it('combine strict and requireLinks', function() {
            var res = halson().addLink('self', '/test').addLink('edit', '/edit');
            var result = res.validate({
                strict: true,
                requireLinks: ['self', 'edit']
            });

            assert.strictEqual(result.valid, true);
            assert.strictEqual(result.errors.length, 0);
            assert.strictEqual(result.warnings.length, 0);
        });
    });

    describe('accepts()', function() {
        it('accept application/hal+json', function() {
            assert.strictEqual(halson().accepts('application/hal+json'), true);
        });

        it('accept application/json', function() {
            assert.strictEqual(halson().accepts('application/json'), true);
        });

        it('reject unsupported types', function() {
            assert.strictEqual(halson().accepts('application/xml'), false);
            assert.strictEqual(halson().accepts('text/html'), false);
        });
    });

    describe('asJson()', function() {
        it('strip _links and _embedded', function() {
            var res = halson({id: 1, name: 'Test'});
            res.addLink('self', '/test');
            res.addEmbed('child', halson({childId: 2}));

            var json = res.asJson();
            assert.strictEqual(json.id, 1);
            assert.strictEqual(json.name, 'Test');
            assert.strictEqual(json._links, undefined);
            assert.strictEqual(json._embedded, undefined);
        });

        it('strip className', function() {
            var json = halson({id: 1}).asJson();
            assert.strictEqual(json.className, undefined);
        });

        it('return empty object for empty resource', function() {
            assert.deepEqual(halson().asJson(), {});
        });
    });

    describe('asHal()', function() {
        it('preserve full HAL structure', function() {
            var res = halson({id: 1});
            res.addLink('self', '/test');

            var hal = res.asHal();
            assert.strictEqual(hal.id, 1);
            expect(hal._links).to.exist;
            assert.strictEqual(hal._links.self.href, '/test');
        });

        it('return plain object (not HALSONResource)', function() {
            var hal = halson({id: 1}).asHal();
            expect(hal.className).to.be.an('undefined');
        });
    });

    describe('getContentType()', function() {
        it('return application/hal+json', function() {
            assert.strictEqual(halson().getContentType(), 'application/hal+json');
        });
    });

    describe('resolve()', function() {
        it('return href for regular link', function() {
            var res = halson().addLink('next', '/page/2');
            assert.strictEqual(res.resolve('next'), '/page/2');
        });

        it('expand template when variables provided', function() {
            var res = halson().addTemplate('search', '/search{?q}');
            assert.strictEqual(res.resolve('search', {q: 'test'}), '/search?q=test');
        });

        it('return undefined for missing rel', function() {
            assert.strictEqual(halson().resolve('missing'), undefined);
        });

        it('return raw template href when no variables', function() {
            var res = halson().addTemplate('search', '/search{?q}');
            // no variables → not templated expansion path
            assert.strictEqual(res.resolve('search'), '/search{?q}');
        });
    });

    describe('follow()', function() {
        it('return a Promise', function() {
            var res = halson().addLink('self', '/test');
            var result = res.follow('self');
            expect(result).to.be.an.instanceOf(Promise);
            // suppress unhandled rejection
            result.catch(function() {});
        });

        it('reject when link not found', function() {
            return halson().follow('missing').then(
                function() { throw new Error('should have rejected'); },
                function(err) {
                    expect(err.message).to.include('not found');
                }
            );
        });

        it('reject when following a link fails', function() {
            var res = halson().addLink('self', '/test');
            return res.follow('self').then(
                function() { throw new Error('should have rejected'); },
                function(err) {
                    expect(err).to.be.an('error');
                }
            );
        });
    });

    describe('followAll()', function() {
        it('resolve to empty array for missing rel', function() {
            return halson().followAll('missing').then(function(results) {
                assert.deepEqual(results, []);
            });
        });
    });

    describe('HALResourceBuilder', function() {
        it('build a resource with links and embeds', function() {
            var resource = halson.HALResourceBuilder({id: 1, name: 'Test'})
                .link('self', '/test')
                .link('edit', {href: '/test/edit', method: 'PUT'})
                .embed('child', halson({childId: 2}))
                .build();

            assert.strictEqual(resource.id, 1);
            assert.strictEqual(resource.name, 'Test');
            assert.strictEqual(resource.getHref('self'), '/test');
            assert.strictEqual(resource.getLink('edit').method, 'PUT');
            expect(resource.getEmbed('child')).to.exist;
        });

        it('support templates', function() {
            var resource = halson.HALResourceBuilder({})
                .template('search', '/search{?q}')
                .build();

            assert.strictEqual(resource.isTemplated('search'), true);
        });

        it('support curies', function() {
            var resource = halson.HALResourceBuilder({})
                .curie('acme', 'https://api.acme.com/rels/{rel}')
                .build();

            assert.strictEqual(resource.hasCurie('acme'), true);
        });

        it('build empty resource from no data', function() {
            var resource = halson.HALResourceBuilder().build();
            expect(resource.className).to.equal(halson.Resource.prototype.className);
        });
    });

    describe('createPagedResource()', function() {
        it('attach page metadata', function() {
            var paged = halson.createPagedResource(
                {items: ['a', 'b']},
                {number: 0, size: 10, totalElements: 25, totalPages: 3}
            );

            assert.strictEqual(paged.page.number, 0);
            assert.strictEqual(paged.page.size, 10);
            assert.strictEqual(paged.page.totalElements, 25);
            assert.strictEqual(paged.page.totalPages, 3);
            assert.deepEqual(paged.items, ['a', 'b']);
        });

        it('hasNext/hasPrev reflect page position', function() {
            var first = halson.createPagedResource({}, {number: 0, size: 10, totalElements: 30, totalPages: 3});
            assert.strictEqual(first.hasNext(), true);
            assert.strictEqual(first.hasPrev(), false);

            var last = halson.createPagedResource({}, {number: 2, size: 10, totalElements: 30, totalPages: 3});
            assert.strictEqual(last.hasNext(), false);
            assert.strictEqual(last.hasPrev(), true);

            var mid = halson.createPagedResource({}, {number: 1, size: 10, totalElements: 30, totalPages: 3});
            assert.strictEqual(mid.hasNext(), true);
            assert.strictEqual(mid.hasPrev(), true);
        });

        it('next/prev return hrefs from links', function() {
            var paged = halson.createPagedResource({}, {number: 1, size: 10, totalElements: 30, totalPages: 3});
            paged.addLink('next', '/page/2');
            paged.addLink('prev', '/page/0');

            assert.strictEqual(paged.next(), '/page/2');
            assert.strictEqual(paged.prev(), '/page/0');
        });

        it('next/prev return null at boundaries', function() {
            var first = halson.createPagedResource({}, {number: 0, size: 10, totalElements: 20, totalPages: 2});
            assert.strictEqual(first.prev(), null);

            var last = halson.createPagedResource({}, {number: 1, size: 10, totalElements: 20, totalPages: 2});
            assert.strictEqual(last.next(), null);
        });

        it('provide default page metadata', function() {
            var paged = halson.createPagedResource({});
            assert.strictEqual(paged.page.number, 0);
            assert.strictEqual(paged.page.size, 20);
            assert.strictEqual(paged.page.totalElements, 0);
            assert.strictEqual(paged.page.totalPages, 0);
        });

        it('be a regular HALSONResource', function() {
            var paged = halson.createPagedResource({id: 1});
            paged.addLink('self', '/page/1');
            expect(paged.className).to.equal(halson.Resource.prototype.className);
            assert.strictEqual(paged.getHref('self'), '/page/1');
        });
    });

    describe('chaining across new methods', function() {
        it('addLink + addTemplate + addCurie chains preserve state', function() {
            var res = halson({id: 1})
                .addLink('self', '/test')
                .addTemplate('search', '/search{?q}')
                .addCurie('acme', 'https://api.acme.com/rels/{rel}');

            assert.strictEqual(res.id, 1);
            assert.strictEqual(res.hasLink('self'), true);
            assert.strictEqual(res.isTemplated('search'), true);
            assert.strictEqual(res.hasCurie('acme'), true);
        });
    });

    describe('round-trip serialization with new features', function() {
        it('preserve curies and links through JSON round-trip', function() {
            var res = halson({data: 'test'});
            res.addLink('self', '/test');
            res.addCurie('acme', 'https://api.acme.com/rels/{rel}');

            var serialized = JSON.stringify(res);
            var deserialized = halson(serialized);

            assert.strictEqual(deserialized.data, 'test');
            assert.strictEqual(deserialized.hasLink('self'), true);
            assert.strictEqual(deserialized.hasCurie('acme'), true);
        });
    });
});
