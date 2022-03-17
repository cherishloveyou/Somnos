import UIKit

/*class ChangeRingtoneViewController: UITableViewController /*  UIViewController */ {
 
 let backgroundColor = UIColor(red: 78/225.0, green: 128/225.0, blue: 185/225.0, alpha: 1)
 
 override func viewDidLoad() {
 super.viewDidLoad()
 view.backgroundColor = backgroundColor
 }
 } */

/* class ChangeRingtoneViewController: UITableViewController /*  UIViewController */ {
 
 let backgroundColor = UIColor(red: 78/225.0, green: 128/225.0, blue: 185/225.0, alpha: 1)
 
 override func viewDidLoad() {
 super.viewDidLoad()
 }
 
 // MARK: - Table view data source
 
 override func numberOfSections(in tableView: UITableView) -> Int {
 // #warning Incomplete implementation, return the number of sections
 return 0
 }
 
 override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
 // #warning Incomplete implementation, return the number of rows
 return 5
 }
 
 override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
 let cell = tableView.dequeueReusableCell(withIdentifier: "RingtoneCell", for: indexPath)
 
 cell.textLabel?.text = "Section \(indexPath.section) Row \(indexPath.row)"
 cell.textLabel?.textColor = backgroundColor
 cell.backgroundColor = .white

 return cell
 }
 } */

//MARK: Test

class ChangeRingtoneViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    
    let tableView = UITableView()
    let backgroundColor = UIColor(red: 78/225.0, green: 128/225.0, blue: 185/225.0, alpha: 1)
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = backgroundColor
        view.addSubview(tableView)
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell")
        tableView.delegate = self
        tableView.dataSource = self
        self.tableView.contentSize.height = 1.0 // disable vertical scroll
    }
    
    var soundNames = [String]()
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        tableView.frame = view.bounds
        soundNames = ["Default Beeping", "Radar", "Apex", "Beacon", "Circuit", "Illuminate", "Signal", "Stargaze", "", "","","","","","","","",""]
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return soundNames.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath)
        cell.textLabel?.text = soundNames[indexPath.row]
        cell.textLabel?.textColor = backgroundColor
        cell.backgroundColor = .white
        
        return cell
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        switch indexPath.row {
        
        case 0:
            selectedSound = "bleep"
            playSound()
            print("BUTTON PRESSED")

            
        case 1 :
            selectedSound = "radar"
            playSound()
            print("BUTTON PRESSED")

    
        case 2:
            selectedSound = ""
            playSound()
            print("BUTTON PRESSED")

            
        case 3 :
            selectedSound = "beacon"
            playSound()
            print("BUTTON PRESSED")

            
        case 4 :
            selectedSound = "circuit"
            playSound()
            print("BUTTON PRESSED")

            
        case 5 :
            selectedSound = "illuminate"
            playSound()
            print("BUTTON PRESSED")

            
        case 6 :
            selectedSound = "signal"
            playSound()
            print("BUTTON PRESSED")

            
        case 7 :
            selectedSound = "stargaze"
            playSound()
            print("BUTTON PRESSED")
            
        default:
            print("")
        }
        
        tableView.deselectRow(at: indexPath, animated: true)
        print(selectedSound)
        
    }
    
}

/* case ["Default Beeping"]:
    selectedSound = "bleep"
    playSound()
    print("BUTTON PRESSED")


case ["Radar"] :
    selectedSound = "radar"
    playSound()
    print("BUTTON PRESSED")

    
case ["Apex"] :
    selectedSound = ""
    playSound()
    print("BUTTON PRESSED")

    
case ["Beacon"] :
    selectedSound = "beacon"
    playSound()
    print("BUTTON PRESSED")

    
case ["Circuit"] :
    selectedSound = "circuit"
    playSound()
    print("BUTTON PRESSED")

    
case ["Illuminate"] :
    selectedSound = "illuminate"
    playSound()
    print("BUTTON PRESSED")

    
case ["Signal"] :
    selectedSound = "signal"
    playSound()
    print("BUTTON PRESSED")

    
case ["Stargaze"] :
    selectedSound = "stargaze"
    playSound()
    print("BUTTON PRESSED")

    
case [""] :
    print("No change")
    playSound()
    print("BUTTON PRESSED")

    
default:
    print("") */
