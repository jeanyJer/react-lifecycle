class FeactDOMComponent {
  	constructor(element) {
    		this._currentElement = element;
  	}

  	mountComponent(container) {
    		const domElement = document.createElement(this._currentElement.type);
    		const textNode = document.createTextNode(this._currentElement.props.children);

    		domElement.appendChild(textNode);
    		container.appendChild(domElement);
        
        this._hostNode = domElement;
        return domElement;
  	}
    
    receiveComponent(nextElement) {
        const prevElement = this._currentElement;
        this.updateComponent(prevElement, nextElement);
    }

    updateComponent(prevElement, nextElement) {
        const lastProps = prevElement.props;
        const nextProps = nextElement.props;

        this._updateDOMProperties(lastProps, nextProps);
        this._updateDOMChildren(lastProps, nextProps);
    }

    _updateDOMProperties(lastProps, nextProps) {
        // nothing to do! I'll explain why below
    }

    _updateDOMChildren(lastProps, nextProps) {
        const lastContent = lastProps.children;
        const nextContent = nextProps.children;

        if (!nextContent) {
            this.updateTextContent('');
        } else if (lastContent !== nextContent) {
            this.updateTextContent('' + nextContent);
        }
    }

    updateTextContent(content) {
        const node = this._hostNode;
        node.textContent = content;

        const firstChild = node.firstChild;

        if (firstChild && firstChild === node.lastChild
                && firstChild.nodeType === 3) {
            firstChild.nodeValue = content;
            return;
        }

        node.textContent = content;
    }
}

class FeactCompositeComponentWrapper {
  	constructor(element) {
    		this._currentElement = element;
  	}

  	mountComponent(container) {
    		const Component = this._currentElement.type;
        const componentInstance = new Component(this._currentElement.props);
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
        const renderedElement = this._instance.render();

        const child = instantiateFeactComponent(renderedElement);
        this._renderedComponent = child;

        return FeactReconciler.mountComponent(child, container);
    }
   
    receiveComponent(nextElement) {
        const prevElement = this._currentElement;
        this.updateComponent(prevElement, nextElement);
    }

    updateComponent(prevElement, nextElement) {
        const nextProps = nextElement.props;
        const inst = this._instance;

        if (inst.componentWillReceiveProps) {
            inst.componentWillReceiveProps(nextProps);
        }

        let shouldUpdate = true;

        if (inst.shouldComponentUpdate) {
            shouldUpdate = inst.shouldComponentUpdate(nextProps);
        }

        if (shouldUpdate) {
            this._performComponentUpdate(nextElement, nextProps);
        } else {
        		inst.props = nextProps;
				}
    }

    _performComponentUpdate(nextElement, nextProps) {
        this._currentElement = nextElement;
        const inst = this._instance;

        inst.props = nextProps;

        this._updateRenderedComponent();
    }

    _updateRenderedComponent() {
        const prevComponentInstance = this._renderedComponent;
        const inst = this._instance;
        const nextRenderedElement = inst.render();

        FeactReconciler.receiveComponent(prevComponentInstance, nextRenderedElement);
    }
}

const TopLevelWrapper = function(props) {
		this.props = props;
};

TopLevelWrapper.prototype.render = function() {
  return this.props;
};

function instantiateFeactComponent(element) {
    if (typeof element.type === 'string') {
        return new FeactDOMComponent(element);
    } else if (typeof element.type === 'function') {
        return new FeactCompositeComponentWrapper(element);
    }
}

const FeactReconciler = {
    mountComponent(internalInstance, container) {
        return internalInstance.mountComponent(container);
    },
    
    receiveComponent(internalInstance, nextElement) {
    		internalInstance.receiveComponent(nextElement);
    }
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
    
	  createClass(config) {
      	function ComponentClass(props) {
        		this.props = props;
      	}

      	ComponentClass.prototype = Object.assign(ComponentClass.prototype, config);

      	return ComponentClass;
    },
    
    render(element, container) {
    		const prevComponent = getTopLevelComponentInContainer(container);
        
        if (prevComponent) {
        		return updateRootComponent(prevComponent, element);
        } else {
        		return renderNewRootComponent(element, container);
        }
    }
};

function getTopLevelComponentInContainer(container) {
    return container.__feactComponentInstance;
}

function renderNewRootComponent(element, container) {
		const wrapperElement = Feact.createElement(TopLevelWrapper, element);
  	const componentInstance = new FeactCompositeComponentWrapper(wrapperElement);

  	const markUp = FeactReconciler.mountComponent(componentInstance, container);
    container.__feactComponentInstance = componentInstance._renderedComponent;
    
    return markUp;
}

function updateRootComponent(prevComponent, nextElement) {
    FeactReconciler.receiveComponent(prevComponent, nextElement);
}

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
		Feact.createElement(MyMessage, { asTitle: true, message: 'this will update in 2 seconds' }),
  	document.getElementById('app')
);

setTimeout(function() {
		Feact.render(
    		Feact.createElement(MyMessage, { asTitle: true, message: 'and updated!' }),
      	document.getElementById('app')
    );
}, 2000);