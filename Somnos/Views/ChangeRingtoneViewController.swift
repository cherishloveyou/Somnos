import UIKit

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
        soundNames = ["Default Beeping", "Radar", "Apex", "Beacon", "Circuit", "Illuminate", "Signal", "Stargaze", "", "","","","","","","","","",""]
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
            print("BUTTON PRESSED")

            
        case 1 :
            selectedSound = "radar"
            print("BUTTON PRESSED")
            playSound()


    
        case 2:
            selectedSound = "apex"
            print("BUTTON PRESSED")

            
        case 3 :
            selectedSound = "beacon"
            print("BUTTON PRESSED")
            playSound()


            
        case 4 :
            selectedSound = "circuit"
            print("BUTTON PRESSED")
            playSound()


            
        case 5 :
            selectedSound = "illuminate"
            print("BUTTON PRESSED")
            playSound()


            
        case 6 :
            selectedSound = "signal"
            print("BUTTON PRESSED")
            playSound()

            
        case 7 :
            selectedSound = "stargaze"
            print("BUTTON PRESSED")
            playSound()
            
        case 8 :
            print("nothing happens")
        
        case 9 :
            print("nothing happens")
        
        case 10 :
            print("nothing happens")

            
        case 11 :
            print("nothing happens")

            
        case 12 :
            print("nothing happens")

            
        case 13 :
            print("nothing happens")

            
        case 14 :
            print("nothing happens")

            
        case 15 :
            print("nothing happens")


        case 16 :
            print("nothing happens")


        case 17 :
            print("nothing happens")


        case 18 :
            print("nothing happens")


            
        default:
            print("")
        }
        
        tableView.deselectRow(at: indexPath, animated: true)
        print(selectedSound)
    }
    
}
