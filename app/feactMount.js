class FeactDOMComponent {
  	constructor(element) {
    		this._element = element;
  	}

  	mountComponent(container) {
		debugger;
		const domElement = document.createElement(this._element.type);
		const textNode = document.createTextNode(this._element.props.children);

		domElement.appendChild(textNode);
		container.appendChild(domElement);
        
        this._hostNode = domElement;
        return domElement;
  	}
}

class FeactCompositeComponentWrapper {
  	constructor(element) {
    	this._element = element;
  	}

  	mountComponent(container) {
		debugger;
    	const Component = this._element.type;
        const componentInstance = new Component(this._element.props);
        this._instance = componentInstance;
        
        if (componentInstance.componentWillMount) {
        		componentInstance.componentWillMount();
        }
        
        const markup = this.performInitialMount(container);
        
        if (componentInstance.componentDidMount) {
        		componentInstance.componentDidMount();
        }
        
        return markup;
  	}
    
    performInitialMount(container) {
		debugger;
        const renderedElement = this._instance.render();

        const child = instantiateFeactComponent(renderedElement);
        this._renderedComponent = child;

        return FeactReconciler.mountComponent(child, container);
    }
}

const TopLevelWrapper = function(props) {
	this.props = props;
};

TopLevelWrapper.prototype.render = function() {
  	return this.props;
};

function instantiateFeactComponent(element) {
	debugger;
    if (typeof element.type === 'string') {
        return new FeactDOMComponent(element);
    } else if (typeof element.type === 'function') {
        return new FeactCompositeComponentWrapper(element);
    }
}

const FeactReconciler = {
    mountComponent(internalInstance, container) {
		debugger;
        return internalInstance.mountComponent(container);
    }
};

const Feact = {
	createElement(type, props, children) {
		debugger;
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
		debugger;
      	function Constructor(props) {
        		this.props = props;
      	}

      	Constructor.prototype = Object.assign(Constructor.prototype, spec);

      	return Constructor;
    },

    render(element, container) {
		debugger;
    	const wrapperElement = this.createElement(TopLevelWrapper, element);
      	const componentInstance = new FeactCompositeComponentWrapper(wrapperElement);
        
        return FeactReconciler.mountComponent(componentInstance, container);
      	//return componentInstance.mountComponent(container);
    }
};

const MyH1 = Feact.createClass({
  	render() {
    		return Feact.createElement('h1', null, this.props.message);
  	}
});

const MyMessage = Feact.createClass({
	componentWillMount() {
		console.log('about to mount with', this.props.message);
    },
    
    componentDidMount() {
    	console.log('and just finished mounting');
    },
    
  	render() {
		if (this.props.asTitle) {
				return Feact.createElement(MyH1, { message: this.props.message });
		} else {
			return Feact.createElement('p', null, this.props.message);    
		}
  	}
});

Feact.render(
	Feact.createElement(MyMessage, { asTitle: true, message: 'open the console to see componentWillMount and componentDidMount\'s output' }),
  	document.getElementById('app')
);