{   
    // read config 
    var conf_path = './conf.jsx'
    var nested_file = new File(conf_path)
    if (nested_file.exists)
    {
        nested_file.open("r")
        eval(nested_file.read())
        nested_file.close()
    }
    else
    {
        alert('Config is absent!')
        throw "Incorrect data"
    }
    //
    var output_template = OUTPUT_TEMPLATE
    var sys_render_folder_name = SYS_RENDER_FOLDER_NAME
    var start_search_sys_folder = START_SEARCH_SYS_FOLDER
    //var start_search_sys_folder = START_SEARCH_SYS_FOLDER
    var common_comp_path = COMMON_COMP_PATH
    var common_comp_name = COMMON_COMP_NAME
    var common_comp_ae_folder = COMMON_COMP_AE_FOLDER
    var project_fps = PROJECT_FPS
    var project_bpc = PROJECT_BPC
    
    var gui_mode = true
    var out_errors = ''
    var dict_seq = []
    
    var bru_project
    var io = new ImportOptions()
    
    function stopp(){}

    function import_folder_seqs(ae_folder, seq_array)
    // import sequences to AE folder
    {
        for (i=0; i<seq_array.length; i++)
        {
            io.file = seq_array[i]
            if (!io.canImportAs(ImportAsType.FOOTAGE)){continue}
            io.sequence = true
            imported_seq = bru_project.importFile(io)
            imported_seq.parentFolder = ae_folder
        }
    }
    
    function get_sequences(sys_folder_path)
    // collect sys folder files in dict
    {
        var fld = Folder(sys_folder_path)
        if (! fld.exists )
        {
            alert("Folder " + sys_folder_path + " does not exist!")
            return
        }
        var root_childs = fld.getFiles()
        var folder_name = sys_folder_path.split('/').slice(-1)[0]
        dict_seq = []
        
        for (i=0; i<root_childs.length; i++)
        {
            if (root_childs[i] instanceof File)
            {
                var file_name = root_childs[i].name
                if (file_name.slice(0,1) == '.')
                {
                    continue
                }
                var is_present = false
                
                // init dict
                if (!dict_seq.length)
                {
                    dict_seq.push(root_childs[i])
                    continue
                }
                
                // check if file already in dict
                for (j=0; j<dict_seq.length; j++)
                {
                    if (file_name.split('.')[0] == dict_seq[j].name.split('.')[0])
                    {
                        is_present = true
                        break
                    }
                    
                }
                if (is_present)
                {
                    continue
                }
                // add file obj to dict
                dict_seq.push(root_childs[i])
            }
        }
    }
    
    
    function create_CC_comp(params, masks, noises)
    // creates composition tamplate
    {
        var common_comp = bru_project.items.addComp(common_comp_name, params[0], params[1], params[2], params[3], project_fps)
        //common_comp.parentFolder = parent_folder
        // layers criation
        //Noises
        var noise_layer
        for (i=1; i<=noises.items.length; i++)
        {
            duration = noises.item(i).duration
            noise_layer = common_comp.layers.add(noises.item(i))
            noise_layer.property("Effects").addProperty("ADBE Easy Levels2")
            noise_layer.blendingMode = BlendingMode.OVERLAY
            noise_layer.trackMatteType = TrackMatteType.LUMA
        }        
        // Masks
        var masks_layer
        for (i=1; i<=masks.items.length; i++)
        {
            duration = masks.item(i).duration
            masks_layer = common_comp.layers.add(masks.item(i))
            masks_layer.property("Effects").addProperty("Cryptomatte")
        }
        // Adjustment
        var solid_layer = common_comp.layers.addSolid([0,0,0], 'solid',  params[0], params[1], params[2], params[3])
        solid_layer.adjustmentLayer = true
        solid_layer.property("Effects").addProperty("ADBE CurvesCustom")
        solid_layer.property("Effects").addProperty("ADBE Sharpen")
        return common_comp
    }
    
    function import_composition_from(comp_file)
    {
        var err_out = "Common Composition is not found!\nPlease, loock at the conf.jsx file and check\ncompositoin file structure!\nStandart Common Composition will be created!"
        //open template project
        var root_folder = undefined
        bru_project = app.open(comp_file)
        //find by name "CC" composition from "comp" folder and return it
        //find "comp" root folder  
        for (i=1; i<=bru_project.items.length;i++)
        {
            if (bru_project.items[i] instanceof FolderItem && bru_project.items[i].name == common_comp_ae_folder)
            {
                root_folder = bru_project.items[i]
                break
            }
        } 
        
        if (root_folder == undefined)
        {
            alert(err_out)
            return undefined
        }
        
        //find "CC" composition
        for (i=1; i<=root_folder.items.length; i++)
        {
            if (root_folder.items[i] instanceof CompItem && root_folder.items[i].name == common_comp_name)
            {
                return root_folder.items[i]
            }
        }
        //if "CC" composition is not found
        alert(err_out)
        return undefined
    }

    function bru_main(sys_root_path, comp_file_path)
    {
        var main_folder = Folder(sys_root_path)
        if (main_folder instanceof File || !main_folder.exists)
        {
            alert ("Folder with render sequences is undefined!")
            return
        }
        
        var comp_file = File(comp_file_path)
        var common_comp = undefined
        
        if (comp_file instanceof File && comp_file.exists)
        {
            common_comp = import_composition_from(comp_file)
            //if Common Composition is not present in template project
            //there is creates new clear project
            if (common_comp == undefined)
            {
                bru_project = app.newProject()
            }
        }
        else
        {
            alert('File with composition not exists!\nStandart Common Composition will be created!')
            bru_project = app.newProject()
        }
        
        var temp = sys_root_path.split('/')
        var sys_root_name = temp[temp.length - 1]
        var sys_folders = [sys_root_path, sys_root_path+'/'+'Noise', sys_root_path+'/'+'Masks']
        var if_OMT_exists = true
        // set script create folder settings
        // not working
        //app.settings.saveSetting("Main Pref Section v2", "Pref_SCRIPTING_FILE_NETWORK_SECURITY", "1")
        //app.settings.saveSetting("Settings_Main Pref Section v2", "Pref_SCRIPTING_FILE_NETWORK_SECURITY", "1")

        
        var sys_render_folder = new Folder(sys_root_path+'/'+sys_render_folder_name)
        if (!sys_render_folder.exists)
        {
            sys_render_folder.create()
        }
        
        bru_project.bitsPerChannel = project_bpc
        
        // create AE folders hierarchy
        var ae_root_folder = bru_project.items.addFolder(sys_root_name)
        var ae_raw_folder = ae_root_folder.items.addFolder('RAW_Renders')
        var ae_noise_folder = ae_root_folder.items.addFolder('Noise')
        var ae_masks_folder = ae_root_folder.items.addFolder('Masks')
        var ae_comps_folder = ae_root_folder.items.addFolder('!Comps')
        
        var ae_child_folders = [ae_raw_folder, ae_noise_folder, ae_masks_folder]
        
        // import seq to AE folders
        for (k=0; k<sys_folders.length; k++)
        {
            get_sequences(sys_folders[k])
            import_folder_seqs(ae_child_folders[k],dict_seq)
        }
        
        // create render compositions and put them to !Comps folder
        // create standart Common Composition if render sequences present and if import Common Composition from the file is unsuccessful
        if (ae_raw_folder.items.length > 0)
        {
            var render_comp_params = [ae_raw_folder.item(1).width, ae_raw_folder.item(1).height, ae_raw_folder.item(1).pixelAspect, ae_raw_folder.item(1).duration]
            // if common composition is not imported
            if (common_comp == undefined)
            {
                common_comp = create_CC_comp(render_comp_params, ae_masks_folder, ae_noise_folder)
            }
            common_comp.parentFolder = ae_root_folder
        }
        var render_comp
        var common_comp_layer
        for (ii=1; ii<=ae_raw_folder.items.length; ii++)
        {
            // create render composition
            render_comp = bru_project.items.addComp(ae_raw_folder.item(ii).name.split('.')[0], render_comp_params[0], render_comp_params[1], render_comp_params[2], render_comp_params[3], project_fps)
            render_comp.layers.add(ae_raw_folder.item(ii))
            common_comp_layer = render_comp.layers.add(common_comp)
            common_comp_layer.collapseTransformation = true
            // put render composition to !Comps
            render_comp.parentFolder = ae_comps_folder
            // add render composition to render queue
            render_item = bru_project.renderQueue.items.add(render_comp)
            
            // set render settings
            if (render_item.outputModule(1).templates.indexOf(output_template) != -1)
            {
                render_item.outputModule(1).applyTemplate(output_template) 
            }
            else 
            {
                if (if_OMT_exists)
                {
                    alert(output_template+' is not present in output module templates list! Default settings will be assigned.')
                    if_OMT_exists = false
                }
            }
            render_item.outputModule(1).file = new File(sys_render_folder.fsname+'/'+render_comp.name)
        }
        // save the project

        bru_project.save(new File(sys_root_path + '/' + sys_root_name))
    }

    // main and GUI
    
    var new_project_Win = new Window("palette", "Create new AE template project")
    new_project_Win.orientation = "column"
    new_project_Win.border = [3,3,3,3]
    var groupOne = new_project_Win.add("group")
        groupOne.add("statictext", [0,0,70,10], "Renders:")
        var path_render = groupOne.add("edittext", [0,0,600,18])
    
    var groupTwo = new_project_Win.add("group")
        groupTwo.add("statictext", undefined, "Composition:")
        var path_comp = groupTwo.add("edittext", [0,0,600,18])
        
    var groupThree = new_project_Win.add("group")
        var chooseRenderBtn = groupThree.add("button", undefined, "Choose render")
        var chooseCompBtn = groupThree.add("button", undefined, "Choose composition")
        var importBtn = groupThree.add("button", undefined, "Create Project!")
    
    //-------| Event listeners
	chooseRenderBtn.onClick = function () {
		var target_render_folder = Folder(start_search_sys_folder).selectDlg("Select folder with render sequences")
        //alert(targetFolder)K
        path_render.text = Folder.decode(target_render_folder)

	}
    
    chooseCompBtn.onClick = function () {
        var target_comp_folder = File(common_comp_path).openDlg("Select file with composition template", "*.aet")
        path_comp.text = File.decode(target_comp_folder)

	}

	importBtn.onClick = function () {
		bru_main(path_render.text, path_comp.text)
		new_project_Win.close()
	}
    
    new_project_Win.center()
    new_project_Win.show()
   

}


