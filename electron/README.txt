Project structure organization

network-scanner-490/
	src/
		main/
			main.js			# Electron main process; creates and manages the
						    # browser window, handles lifecycle events, loads
						    # the renderer process.
			preload.js		# Preload script (currently empty); safely exposes
						    # APIs between main and renderer processes
		renderer/
			index.jsx		# React entry point; renders the main UI
						    # components from HomePage.jsx, imports
						    # Bootstrap CSS and custom styles.
			index.css		# global styling
			components/
				HomePage.jsx		# main dashboard
				ListGroup.jsx		# bootstrap navbar (unused in current
							        # render)
				images/		        # image assets
					…
		styles/
			global.css		    # global styling
	index.html				    # html entry point for renderer process, sets page
						        # metadata
	package.json			    # electron app dependencies
    package-lock.json			# electron app dependencies’ versions
    vite.main.config.mjs		# Builds the main process
    ite.preload.config.mjs		# Builds the preload script
    vite.renderer.config.mjs    # Builds the React renderer
    forge.config.js				# orchestrates electron app build pipeline
					            # (specifices process entry points and build output
					            # locations)
    README.txt                  # documentation
