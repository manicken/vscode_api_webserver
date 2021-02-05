import * as vscode from 'vscode';
import * as path from 'path';


interface MenuItemCallbackType { (): void }
interface MenuItem
{
    id:string;
    label:string;
    description:string;
    icon:string;
    action:MenuItemCallbackType;
}

export function NewMenuItem(id:string, label:string, description:string, icon:string, action:MenuItemCallbackType):MenuItem
{
    return {id:id,label:label,description:description,icon:icon,action:action};
}

export function NewMenu(id:string, menuItems:MenuItem[])
{
    vscode.window.registerTreeDataProvider(id, new MenuProvider(menuItems));
}

export class MenuTreeItem extends vscode.TreeItem
{
    constructor(public readonly mi: MenuItem)
    {
        super(mi.label, vscode.TreeItemCollapsibleState.None);

        this.tooltip = mi.description;
        var cmd = "api-webserver-menu-" + mi.id;
        vscode.commands.registerCommand(cmd, mi.action);
        this.command = { command:cmd, title:"", arguments:[] };
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', this.mi.icon),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', this.mi.icon)
        };
    }
}

export class MenuProvider implements vscode.TreeDataProvider<MenuTreeItem>
{
    constructor(private menuItems: MenuItem[]) { }

    getTreeItem(element: MenuTreeItem): vscode.TreeItem { return element; }

    getChildren(element?: MenuTreeItem): Thenable<MenuTreeItem[]>
    {
        if (!this.menuItems || this.menuItems.length == 0)
        {
            vscode.window.showInformationMessage('Menu have no items');
            return Promise.resolve([]);
        }
        return Promise.resolve(this.menuItems.map(mi => new MenuTreeItem(mi)));
    }
}
