class FeactDOMComponent {
  	constructor(element) {
    		this._currentElement = element;
  	}

  	mountComponent(container) {
    		const domElement = document.createElement(this._currentElement.type);
    		const textNode = document.createTextNode(this._currentElement.props.children);

    		domElement.appendChild(textNode);
    		container.appendChild(domElement);
  	}
}

class FeactCompositeComponentWrapper {
  	constructor(element) {
    		this._currentElement = element;
  	}

  	mountComponent(container) {
        const compositeComponentInstance = new this._currentElement.type(this._currentElement.props);
        
        let renderedElement = compositeComponentInstance.render();

        while (typeof renderedElement.type === 'function') {
            renderedElement = new renderedElement.type(renderedElement.props).render();
        }

        const domComponentInstance = new FeactDOMComponent(renderedElement);
        domComponentInstance.mountComponent(container);
  	}
}

const TopLevelWrapper = function(props) {
		this.props = props;
};

TopLevelWrapper.prototype.render = function() {
  return this.props;
};

const Feact = {
		createElement(type, props, children) {
        const element = {
            type,
            props: props || {}
        };

        if (children) {
            element.props.children = children;
        }

        return element;
    },
    
	  createClass(spec) {
      	function Constructor(props) {
        		this.props = props;
      	}

      	Constructor.prototype.render = spec.render;

      	return Constructor;
    },

    render(element, container) {
    	const wrapperElement = this.createElement(TopLevelWrapper, element);
      	const componentInstance = new FeactCompositeComponentWrapper(wrapperElement);
      	return componentInstance.mountComponent(container);
    }
};

const MyH1 = Feact.createClass({
  	render() {
    		return Feact.createElement('h1', null, this.props.message);
  	}
});

const MyMessage = Feact.createClass({
  	render() {
    		if (this.props.asTitle) {
    				return Feact.createElement(MyH1, { message: this.props.message });
    		} else {
      			return Feact.createElement('p', null, this.props.message);    
    		}
  	}
});

Feact.render(
		Feact.createElement(MyMessage, { asTitle: true, message: 'this is an h1 message' }),
  	document.getElementById('app')
);