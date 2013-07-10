(function() {

var tree, rootNode, form;
var nodeIdCounter = 2;

function addNode() {
    var ui = $(this).data("webvs-ui");
    var data = {
        id: nodeIdCounter++,
        ui: ui,
        label: ui.disp,
    };
    tree.tree("appendNode", data, rootNode);
    tree.tree("openNode", rootNode);
}

function nodeSelect(e) {
    var node = e.node;
    form.empty();
    if(!node) {
        return;
    }
    form.jsonForm({
        schema: node.ui.schema,
        form: ["*"],
        onSubmitValid: formSubmitValid
    });
}

function formSubmitValid(values) {
    var selectedNode = tree.tree("getSelectedNode");
    selectedNode.values = values;
    console.dir(generateJson());
}

function generateJson(node) {
    var json = {};
    if(!node) {
        node = rootNode;
    } else {
        json.type = node.ui.type;
    }

    if(node.children && node.children.length > 0) {
        json.components = _.map(node.children, generateJson);
    }

    json = _.extend(json, node.values);
    return json;
}

function initUI() {
    // initialize the add effect menu
    _.chain(Webvs).values().filter(function(value) {
        return _.isFunction(value) && _.isObject(value.ui);
    }).map(function(value) { 
        return value.ui;
    }).each(function(ui) {
        $("<li><a href='#'>"+ui.disp+"</a></li>").data("webvs-ui", ui).appendTo(".new-button .dropdown-menu");
    });

    //initialize form
    form = $('.form');

    // initialize the tree
    tree = $(".tree");
    tree.tree({
        data: [
            {
                id: 1,
                ui: Webvs.ui,
                label: "Main"
            }
        ]
    });
    rootNode = tree.tree("getNodeById", 1);
    tree.tree("selectNode", rootNode);
    nodeSelect({node: rootNode});

    // ---- Begin event Bindings ----
    $(".new-button .dropdown-menu li").click(addNode);
    tree.bind("tree.select", nodeSelect);
    form.change(function() { form.submit(); }); // submit the form on change so that we get values from jsonform
}

$(document).ready(function() {
    initUI();
});

})();
