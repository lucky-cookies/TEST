'''
TESSSTTS



This script mast be exequted from command line only
You mast define two arguments
1: path to the AE Composition template
2: path to the folder with render sequences
'''
import sys
import os

log_out = ''
log_name = '.output_log'
main_jscript_path = os.path.abspath(__file__).replace('\\','/').rsplit('/', 2)[0] + '/Jscripts/create_AE_project.jsx'
win_AE_path = r'C:\Program Files\Adobe\Adobe After Effects 2020\Support Files'
AE_keys = '-noui -s '

def main(path_comp, path_seq):
    global log_out
    new_path_comp = path_comp.replace('\\', '/')
    new_path_seq = path_seq.replace('\\', '/')
    
    if not os.path.exists(new_path_comp) or not os.path.isfile(new_path_comp) or not new_path_comp.endswith('.aet'):
        log_out += 'The file with template AE composition is not defined\n'
    
    if not os.path.exists(new_path_seq) or not os.path.isdir(new_path_seq):
        log_out += 'The folder with rendered sequences is not defined\n'
    
    if log_out:
        log_out = 'PYTHON SCRIPT:\n' + log_out
        save_log_file(path_seq)
        return
    else:
        log_out = 'PYTHON SCRIPT:\n'
        save_log_file(path_seq)

    jscript_code_line_1 = '"{ var NON_GUI_MODE=true; '
    jscript_code_line_2 = 'var SEQUENCE_FOLDER_PATH="' + new_path_seq + '";'
    jscript_code_line_3 = 'var COMPOSITION_TEMPLATE_FILE="' + new_path_comp + '";'
    jscript_code_line_4 = 'var f = new File("' + main_jscript_path + '");'
    jscript_code_line_5 = 'f.open("r"); eval(f.read()); f.close();'
    jscript_code_line_6 = 'delete NON_GUI_MODE;}"'

    cmd = 'AfterFx.exe ' + AE_keys + jscript_code_line_1 + jscript_code_line_2 + jscript_code_line_3 + jscript_code_line_4 + jscript_code_line_5 + jscript_code_line_6
    #print main_jscript_path
    os.chdir(win_AE_path)
    os.system(cmd)

def save_log_file(folder_path):
    with open(folder_path + '/' + log_name, 'w') as f:
        f.write(log_out)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print 'You mast define two arguments\n1: path to the AE Composition template\n2: path to the folder with render sequences'
    
    else:
        main(sys.argv[1], sys.argv[2])
