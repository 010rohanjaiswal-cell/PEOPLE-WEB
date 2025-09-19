const fs = require('fs');
const path = require('path');

// Commission ledger file path
const COMMISSION_LEDGER_FILE = path.join(__dirname, '../data/commission-ledger.json');

// Ensure data directory exists
const dataDir = path.dirname(COMMISSION_LEDGER_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load commission ledger from file
const loadCommissionLedger = () => {
  try {
    if (fs.existsSync(COMMISSION_LEDGER_FILE)) {
      const data = fs.readFileSync(COMMISSION_LEDGER_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading commission ledger:', error);
    return [];
  }
};

// Save commission ledger to file
const saveCommissionLedger = (ledger) => {
  try {
    fs.writeFileSync(COMMISSION_LEDGER_FILE, JSON.stringify(ledger, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving commission ledger:', error);
    return false;
  }
};

// Add commission entry to freelancer's ledger
const addCommissionEntry = async (req, res) => {
  try {
    const { freelancerId, jobId, jobTitle, clientName, amount, totalAmount } = req.body;
    
    if (!freelancerId || !jobId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: freelancerId, jobId, amount'
      });
    }

    const ledger = loadCommissionLedger();
    
    // Create new commission entry
    const newEntry = {
      id: `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      freelancerId,
      jobId,
      jobTitle: jobTitle || 'Unknown Job',
      clientName: clientName || 'Unknown Client',
      amount: parseFloat(amount),
      totalAmount: parseFloat(totalAmount) || parseFloat(amount),
      status: 'pending', // pending, paid
      createdAt: new Date().toISOString(),
      paidAt: null
    };

    ledger.push(newEntry);
    
    if (saveCommissionLedger(ledger)) {
      console.log('✅ Commission entry added:', newEntry);
      res.json({
        success: true,
        message: 'Commission entry added successfully',
        entry: newEntry
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to save commission entry'
      });
    }
  } catch (error) {
    console.error('Error adding commission entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add commission entry'
    });
  }
};

// Get commission ledger for a freelancer
const getCommissionLedger = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    
    if (!freelancerId) {
      return res.status(400).json({
        success: false,
        message: 'Freelancer ID is required'
      });
    }

    const ledger = loadCommissionLedger();
    const freelancerEntries = ledger.filter(entry => entry.freelancerId === freelancerId);
    
    // Calculate totals
    const totalPending = freelancerEntries
      .filter(entry => entry.status === 'pending')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalPaid = freelancerEntries
      .filter(entry => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);

    res.json({
      success: true,
      entries: freelancerEntries,
      summary: {
        totalPending,
        totalPaid,
        totalEntries: freelancerEntries.length
      }
    });
  } catch (error) {
    console.error('Error getting commission ledger:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission ledger'
    });
  }
};

// Pay commission (mark as paid)
const payCommission = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { amount } = req.body;
    
    if (!entryId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Entry ID and amount are required'
      });
    }

    const ledger = loadCommissionLedger();
    const entryIndex = ledger.findIndex(entry => entry.id === entryId);
    
    if (entryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Commission entry not found'
      });
    }

    const entry = ledger[entryIndex];
    
    if (entry.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Commission already paid'
      });
    }

    // Update entry
    ledger[entryIndex] = {
      ...entry,
      status: 'paid',
      paidAt: new Date().toISOString(),
      paidAmount: parseFloat(amount)
    };
    
    if (saveCommissionLedger(ledger)) {
      console.log('✅ Commission paid:', ledger[entryIndex]);
      res.json({
        success: true,
        message: 'Commission payment recorded successfully',
        entry: ledger[entryIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to save commission payment'
      });
    }
  } catch (error) {
    console.error('Error paying commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record commission payment'
    });
  }
};

// Check if commission is paid for a job
const checkCommissionStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    const ledger = loadCommissionLedger();
    const entry = ledger.find(entry => entry.jobId === jobId);
    
    if (!entry) {
      return res.json({
        success: true,
        hasCommission: false,
        status: 'no_commission'
      });
    }

    res.json({
      success: true,
      hasCommission: true,
      status: entry.status,
      entry: entry
    });
  } catch (error) {
    console.error('Error checking commission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check commission status'
    });
  }
};

module.exports = {
  addCommissionEntry,
  getCommissionLedger,
  payCommission,
  checkCommissionStatus
};
